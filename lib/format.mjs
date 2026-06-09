import prettier from 'prettier'
import {defaultConfig} from './config.mjs'
import {lint} from './lint.mjs'
import {onlyParamOptions, validateOnlyParam} from './onlyParam.mjs'
import {format as jsoncFormat, applyEdits} from 'jsonc-parser'

// This Prettier config should match what the Bruno GUI implements
const defaultPrettierConfig = {
    semi: false,
    tabWidth: 2,
    singleQuote: false,
    useTabs: false,
    bracketSpacing: false,
    printWidth: 80,
    trailingComma: 'none',
    endOfLine: 'lf',
    parser: 'babel',
}

const formattableBlocks = [
    'body:json',
    'body:graphql',
    'body:graphql:vars',
    'script:pre-request',
    'script:post-response',
    'tests',
]

const maskPattern = /("(?:\\.|[^"\\])*")|(\{\{.*?\}\})/g
const unmaskPattern = /"__⇎⇎START__(\{\{.*?\}\})__END⇎⇎__"/g

/**
 * @typedef {Object} FileOutcome Represents the result of processing a file
 * @property {string} newContents
 * @property {number} blocksSearchedFor
 * @property {boolean} changeable Indicates if there are any changes that can be made
 * @property {BlockReport[]} blockReports
 */

/**
 * @typedef {Object} BlockReport Represents the result of processing a block
 * @property {?string} blockName If null, it relates to the file structure in generate, not a specific block
 * @property {Issue[]} issues
 */

/**
 * @typedef {Object} Issue Represents a single problem
 * @property {boolean} [fatal]
 * @property {boolean} fixable
 * @property {number} severity 1 = Warning, 2 = Error
 * @property {string} message Description of the problem
 */

/**
 * Tidies structure of bru lang file, makes code shorter and operating system agnostic,
 * applies standard formatting to both JSON and JavaScript blocks
 *
 * @param {string} originalContents The file contents as loaded from file system
 * @param {?string} only Limit to only the block type with a name containing value
 * @param {Object} configOverrides Could be whole PrettifyBruConfig or partial
 * @param {?import('eslint').ESLint} esLintEngine
 * @param {boolean} fix Whether to apply the fixes for fixable issues
 * @returns {Promise<FileOutcome>}
 */
export async function format(
    originalContents,
    only = null,
    configOverrides = {},
    esLintEngine = null,
    fix = false
) {
    validateOnlyParam(only)

    /** @type {import('./config.mjs').PrettifyBruConfig} */
    const config = {
        ...defaultConfig,
        ...configOverrides,
        prettier: Object.assign(
            {},
            defaultPrettierConfig,
            Object.hasOwn(configOverrides, 'prettier') ? configOverrides.prettier : {}
        ),
    }

    /** @type FileOutcome */
    let fileOutcome = {
        newContents: originalContents.replace(/\r\n/g, '\n'),
        blocksSearchedFor: 0,
        changeable: false,
        blockReports: [],
    }

    for (const blockName of formattableBlocks) {
        if (only !== null && !blockName.match(onlyParamOptions[only])) continue

        const blockOutcome = await formatBlock(
            fileOutcome.newContents,
            blockName,
            config,
            esLintEngine,
            fix
        )
        fileOutcome.blocksSearchedFor++

        if (blockOutcome.issues.length) {
            fileOutcome.blockReports.push({
                blockName: blockName,
                issues: [...blockOutcome.issues],
            })
        }
        if (blockOutcome.changeable) {
            fileOutcome.changeable = true
            fileOutcome.newContents = blockOutcome.fileContents
        }
    }

    formattableBlocks.forEach(blockName => {
        const emptyBlockOutcome = stripEmptyBlock(fileOutcome.newContents, blockName)

        if (emptyBlockOutcome.changeable) {
            fileOutcome.changeable = true
            fileOutcome.newContents = emptyBlockOutcome.fileContents
            fileOutcome.blockReports.push({
                blockName: blockName,
                issues: [{fixable: true, message: 'No contents', severity: 2}],
            })
        }
    })

    if (only === null && config.agnosticFilePaths) {
        const fileBodyBlockOutcome = formatFilePaths(fileOutcome.newContents)
        if (fileBodyBlockOutcome.messages.length) {
            fileOutcome.blockReports.push({
                blockName: 'body:file',
                issues: [...fileBodyBlockOutcome.messages],
            })
            fileOutcome.changeable = true
            fileOutcome.newContents = fileBodyBlockOutcome.fileContents
        }
    }

    const overallOutcome = formatOverallStructure(fileOutcome.newContents)
    if (overallOutcome.changeable) {
        fileOutcome.changeable = true
        fileOutcome.blockReports.push({
            blockName: null,
            issues: [{fixable: true, message: 'Excess lines between blocks', severity: 2}],
        })
        fileOutcome.newContents = overallOutcome.fileContents
    }

    return fileOutcome
}

/**
 * @param {string} fileContents
 * @param {string} blockName The block to search for within the file contents
 * @param {import('./config.mjs').PrettifyBruConfig} config
 * @param {?import('eslint').ESLint} esLintEngine
 * @param {boolean} fix Whether to apply the fixes for fixable issues
 * @returns {Promise<{fileContents: string, blockName: string, changeable: boolean, issues: Issue[]}>}
 */
async function formatBlock(fileContents, blockName, config, esLintEngine, fix) {
    let outcome = {fileContents, blockName, changeable: false, issues: []}

    const blockBodyRegex = new RegExp('\n' + blockName + ' [{]\\n(  .+?)\\n}\\n', 's')
    const match = fileContents.match(blockBodyRegex)
    if (match === null) {
        return outcome
    }
    const rawBody = match[1]

    // Remove 2-spaces of indentation, added due to being inside a Bru lang block
    let unindented = rawBody.replace(/^  /gm, '')

    const blockType = calculateBlockType(blockName)

    if (esLintEngine !== null && blockType === 'JavaScript') {
        const lintOutcome = await lint(unindented, esLintEngine, fix)
        if (lintOutcome.messages.length > 0) {
            outcome.issues.push(...lintOutcome.messages)
            outcome.changeable = lintOutcome.messages.some(message => message.fixable)
        }
        if (fix) {
            unindented = lintOutcome.code
        }
    }

    if (config.shortenGetters && ['script:post-response', 'tests'].includes(blockName)) {
        const shortenGettersOutcome = shortenGetters(unindented)
        if (shortenGettersOutcome.messages.length > 0) {
            outcome.issues.push(...shortenGettersOutcome.messages)
            unindented = shortenGettersOutcome.code
        }
    }

    let reformatted

    if (blockType === 'JSON' && config.jsonFormatter === 'jsonc-parser') {
        unindented = wrapNonStringPlaceholdersInDelimiters(unindented)
        const edits = jsoncFormat(unindented, undefined, {tabSize: 2, insertSpaces: true})
        reformatted = applyEdits(unindented, edits)
        reformatted = unwrapDelimitedPlaceholders(reformatted)
    } else {
        try {
            const opts = {...config.prettier}
            if (blockType === 'GraphQL') {
                opts.parser = 'graphql'
                opts.bracketSpacing = true
                unindented = wrapNonStringPlaceholdersInDelimiters(unindented)
            } else if (blockName === 'body:json' || blockName === 'body:graphql:vars') {
                // Use Prettier with jsonc parser for JSON blocks when jsonFormatter is set to "prettier"
                opts.parser = 'jsonc'
                opts.trailingComma = 'none'
                unindented = wrapNonStringPlaceholdersInDelimiters(unindented)
            }
            reformatted = await prettier.format(unindented, opts)

            if (blockType === 'GraphQL' || blockType === 'JSON') {
                reformatted = unwrapDelimitedPlaceholders(reformatted)
            }
        } catch (e) {
            const fatalMessage = `Prettier could not format ${blockName} because...\n${e.message}`
            const fatalIndex = outcome.issues.findIndex(issue => issue.fatal)
            if (fatalIndex !== -1) {
                // Update the existing fatal issue from ESLint with the slightly nicer format from Prettier
                outcome.issues[fatalIndex].message = fatalMessage
                return outcome
            }
            outcome.issues.push({
                fatal: true,
                fixable: false,
                message: fatalMessage,
                severity: 2,
            })
            return outcome
        }
    }

    const bodyLines = reformatted.split('\n')

    // Remove leading/trailing empty lines
    while (bodyLines.length && bodyLines[0].trim() === '') bodyLines.shift()
    while (bodyLines.length && bodyLines[bodyLines.length - 1].trim() === '') bodyLines.pop()

    // GraphQL formatter in Bruno always have exactly 1 line in the end
    if (bodyLines.length > 0 && blockType === 'GraphQL') {
        bodyLines.push('')
    }

    // Indent the whole body by 2 spaces so it sits inside the Bru lang Multimap
    const indentedLines = bodyLines.map(l => '  ' + l)

    const formattedBody = indentedLines.join('\n')

    if (formattedBody === rawBody) {
        // Nothing has changed after formatting, so this block is not changeable
        return outcome
    }

    outcome.fileContents = fileContents.replace(rawBody, formattedBody)
    outcome.changeable = true
    outcome.issues.push({
        fixable: true,
        message: `Badly formatted ${blockType}`,
        severity: 2,
    })
    return outcome
}

/**
 *
 * @param {string} blockName
 * @returns {("JavaScript"|"JSON"|"GraphQL")}
 */
function calculateBlockType(blockName) {
    if (blockName === 'body:graphql') {
        return 'GraphQL'
    }
    if (blockName === 'body:json' || blockName === 'body:graphql:vars') {
        return 'JSON'
    }
    // it must be script:post-response, script:pre-request or tests
    return 'JavaScript'
}

/**
 * @param {string} code
 * @returns {{code: string, messages: Issue[]}}
 */
function shortenGetters(code) {
    const outcome = {code, messages: []}
    const props = ['body', 'headers', 'responseTime', 'status', 'statusText', 'url']
    props.forEach(prop => {
        const getter = 'get' + prop.substring(0, 1).toUpperCase() + prop.substring(1)
        const getterRegex = new RegExp('(?<!\\w)res\.' + getter + '\\(\\)', 'g')
        if (code.match(getterRegex)) {
            const replacement = `res.${prop}`
            outcome.messages.push({
                fixable: true,
                message: `res.${getter}() used instead of ${replacement}`,
                severity: 2,
            })
            code = code.replaceAll(getterRegex, replacement)
        }
    })
    outcome.code = code
    return outcome
}

/**
 * Turns Bruno variable placeholders into strings with special delimiters, effectively making it valid JSON,
 * and for standard cases also valid GraphQL.
 *
 * @param {string} block
 * @returns {string}
 */
function wrapNonStringPlaceholdersInDelimiters(block) {
    return block.replace(maskPattern, (match, group1, group2) => {
        // If group1 exists, we found a standard JSON string. Return it untouched.
        if (group1) {
            return group1
        }

        // If group2 exists, we found a placeholder outside a string.
        // Wrap it in a unique dummy string.
        return `"__⇎⇎START__${group2}__END⇎⇎__"`
    })
}

/**
 * Reverts delimited Bruno variable placeholders back to their original form within a JSON block.
 *
 * @param {string} block
 * @returns {string}
 */
function unwrapDelimitedPlaceholders(block) {
    return block.replace(unmaskPattern, '$1')
}

/**
 * @param {string} fileContents
 * @param {string} blockName
 * @returns {{fileContents: string, changeable: boolean}}
 */
function stripEmptyBlock(fileContents, blockName) {
    const emptyBlockRegex = new RegExp('\n' + blockName + ' [{]\\n}\\n', 's')

    if (fileContents.match(emptyBlockRegex) !== null) {
        return {
            fileContents: fileContents.replace(emptyBlockRegex, ''),
            changeable: true,
        }
    }

    return {fileContents, changeable: false}
}

/**
 * Searches for uses of @file(...) where the path argument uses Windows-specific back slashes
 * instead of OS-agnostic forward slashes
 *
 * @param {string} fileContents
 * @returns {{fileContents: string, changeable: boolean, messages: Issue[]}}
 */
function formatFilePaths(fileContents) {
    const outcome = {changeable: false, fileContents, messages: []}

    const matches = fileContents.matchAll(/file: @file\(([^)]+)\)/g)

    for (const match of matches) {
        const path = match[1]
        if (path.match(/\\/) !== null) {
            const newPath = path.replaceAll('\\', '/')
            outcome.changeable = true
            outcome.fileContents = outcome.fileContents.replace(path, newPath)
            outcome.messages.push({
                fixable: true,
                message: 'Back slash separators used in @file()',
                severity: 2,
            })
        }
    }

    return outcome
}

/**
 * @param {string} fileContents
 * @returns {{fileContents: string, changeable: boolean}}
 */
function formatOverallStructure(fileContents) {
    if (fileContents.match(/\n[}]\n[\s]+\n\w+/s) === null) {
        return {fileContents, changeable: false}
    }

    return {
        fileContents: fileContents.replaceAll(/(\n[}]\n)([\s]+)(\n\w+)/gs, '$1$3'),
        changeable: true,
    }
}
