import prettier from 'prettier'
import {defaultConfig} from './config.mjs'
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

const formattableBlocks = ['body:json', 'script:pre-request', 'script:post-response', 'tests']

/**
 * @typedef {Object} FileOutcome
 * @property {string} newContents
 * @property {number} blocksSearchedFor
 * @property {boolean} changeable
 * @property {string[]} errorMessages
 */

/**
 * Tidies structure of bru lang file, makes code shorter and operating system agnostic,
 * applies standard formatting to both JSON and JavaScript blocks
 *
 * @param {string} originalContents The file contents as loaded from file system
 * @param {?string} only Limit to only the block type with a name containing value
 * @param {Object} configOverrides Could be whole PrettifyBruConfig or partial
 * @returns {Promise<FileOutcome>}
 */
export async function format(originalContents, only = null, configOverrides = {}) {
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

    let fileOutcome = {
        newContents: originalContents.replace(/\r\n/g, '\n'),
        blocksSearchedFor: 0,
        changeable: false,
        errorMessages: [],
    }

    for (const blockName of formattableBlocks) {
        if (only !== null && !blockName.includes(only)) continue

        const blockOutcome = await formatBlock(fileOutcome.newContents, blockName, config)
        fileOutcome.blocksSearchedFor++
        if (blockOutcome.errorMessage !== null) {
            fileOutcome.errorMessages.push(blockOutcome.errorMessage)
        } else if (blockOutcome.changeable) {
            fileOutcome.changeable = true
            fileOutcome.newContents = blockOutcome.fileContents
        }
    }

    formattableBlocks.forEach(blockName => {
        const emptyBlockOutcome = stripEmptyBlock(fileOutcome.newContents, blockName)

        if (emptyBlockOutcome.changeable) {
            fileOutcome.changeable = true
            fileOutcome.newContents = emptyBlockOutcome.fileContents
        }
    })

    if (only === null && config.agnosticFilePaths) {
        const fileBodyBlockOutcome = formatFilePaths(fileOutcome.newContents)
        if (fileBodyBlockOutcome.errorMessage !== null) {
            fileOutcome.errorMessages.push(fileBodyBlockOutcome.errorMessage)
        } else if (fileBodyBlockOutcome.changeable) {
            fileOutcome.changeable = true
            fileOutcome.newContents = fileBodyBlockOutcome.fileContents
        }
    }

    const overallOutcome = formatOverallStructure(fileOutcome.newContents)
    if (overallOutcome.changeable) {
        fileOutcome.changeable = true
        fileOutcome.newContents = overallOutcome.fileContents
    }

    return fileOutcome
}

/**
 * @param {string} fileContents
 * @param {string} blockName
 * @param {import('./config.mjs').PrettifyBruConfig} config
 * @returns {Promise<{fileContents: string, changeable: boolean, errorMessage: ?string}>}
 */
async function formatBlock(fileContents, blockName, config) {
    let outcome = {fileContents, changeable: false, errorMessage: null}

    const blockBodyRegex = new RegExp('\n' + blockName + ' [{]\\n(.+?)\\n}\\n', 's')
    const match = fileContents.match(blockBodyRegex)
    if (match === null) {
        return outcome
    }
    const rawBody = match[1]

    // Remove 2-spaces of indentation, added due to being inside a Bru lang block
    let unindented = rawBody.replace(/^  /gm, '')

    if (config.shortenGetters && ['script:post-response', 'tests'].includes(blockName)) {
        unindented = shortenGetters(unindented)
    }

    let reformatted

    if (blockName === 'body:json') {
        unindented = wrapNonStringPlaceholdersInDelimiters(unindented)
        const edits = jsoncFormat(unindented, undefined, {tabSize: 2, insertSpaces: true})
        reformatted = applyEdits(unindented, edits)
        reformatted = unwrapDelimitedPlaceholders(reformatted)
    } else {
        try {
            reformatted = await prettier.format(unindented, config.prettier)
        } catch (e) {
            outcome.errorMessage = `Prettier could not format ${blockName} because...\n${e.message}`
            return outcome
        }
    }

    const bodyLines = reformatted.split('\n')

    // Remove leading/trailing empty lines
    while (bodyLines.length && bodyLines[0].trim() === '') bodyLines.shift()
    while (bodyLines.length && bodyLines[bodyLines.length - 1].trim() === '') bodyLines.pop()

    // Indent the whole body by 2 spaces so it sits inside the Bru lang Multimap
    const indentedLines = bodyLines.map(l => '  ' + l)

    const formattedBody = indentedLines.join('\n')

    if (formattedBody === rawBody) {
        // Nothing has changed after formatting, so this block is not changeable
        return outcome
    }

    outcome.fileContents = fileContents.replace(rawBody, formattedBody)
    outcome.changeable = true
    return outcome
}

/**
 * @param {string} blockContents
 * @returns {string}
 */
function shortenGetters(blockContents) {
    const props = ['body', 'headers', 'responseTime', 'status', 'statusText', 'url']
    props.forEach(prop => {
        const getter = 'get' + prop.substring(0, 1).toUpperCase() + prop.substring(1)
        const getterRegex = new RegExp('(?<!\\w)res\.' + getter + '\\(\\)', 'g')
        blockContents = blockContents.replaceAll(getterRegex, `res.${prop}`)
    })
    return blockContents
}

/**
 * Turns Bruno variable placeholders into strings with special delimiters, effectively making it valid JSON
 *
 * @param {string} jsonBlock
 * @returns {string}
 */
function wrapNonStringPlaceholdersInDelimiters(jsonBlock) {
    return jsonBlock.replace(/(:[^"]*)([{]{2}[^}]+}})([^"⇎])/g, '$1"⇎$2⇎"$3')
}

/**
 * Reverts delimited Bruno variable placeholders back to their original form within a JSON block.
 *
 * @param {string} jsonBlock
 * @returns {string}
 */
function unwrapDelimitedPlaceholders(jsonBlock) {
    return jsonBlock.replace(/"⇎({{[^}]+}})⇎"/g, '$1')
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
 * @param {string} fileContents
 * @returns {{fileContents: string, changeable: boolean, errorMessage: ?string}}
 */
function formatFilePaths(fileContents) {
    let changeable = false

    const matches = fileContents.matchAll(/file: @file\(([^)]+)\)/g)

    for (const match of matches) {
        const path = match[1]
        if (path.match(/\\/) !== null) {
            const newPath = path.replaceAll('\\', '/')
            changeable = true
            fileContents = fileContents.replace(path, newPath)
        }
    }

    return {fileContents, changeable, errorMessage: null}
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
