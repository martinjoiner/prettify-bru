import prettier from 'prettier'

// This Prettier config should match what the Bruno GUI implements
const prettierConfig = {
    semi: false,
    tabWidth: 2,
    singleQuote: false,
    useTabs: false,
    bracketSpacing: false,
    trailingComma: 'none',
    endOfLine: 'lf',
}

const formattableBlocks = [
    ['body:json', 'json'],
    ['script:pre-request', 'babel'],
    ['script:post-response', 'babel'],
    ['tests', 'babel'],
]

/**
 * Tidies overall structure of bru lang file and uses Prettier to format blocks of JSON/JavaScript
 *
 * @param {string} originalContents The file contents as loaded from file system
 * @param {?string} only Limit to only the block type with a name containing value
 * @returns {Promise<{newContents: string, blocksSearchedFor: number, changeable: boolean, errorMessages: string[]}>}
 */
export async function format(originalContents, only = null) {
    let fileOutcome = {
        newContents: originalContents.replace(/\r\n/g, '\n'),
        blocksSearchedFor: 0,
        changeable: false,
        errorMessages: [],
    }

    let i
    for (i in formattableBlocks) {
        let [blockName, parser] = formattableBlocks[i]
        if (only !== null && !blockName.includes(only)) continue

        const blockOutcome = await formatBlock(fileOutcome.newContents, blockName, parser)
        fileOutcome.blocksSearchedFor++
        if (blockOutcome.errorMessage !== null) {
            fileOutcome.errorMessages.push(blockOutcome.errorMessage)
        } else if (blockOutcome.changeable) {
            fileOutcome.changeable = true
            fileOutcome.newContents = blockOutcome.fileContents
        }
    }

    if (only === null) {
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
 * @param {string} parser
 * @returns {Promise<{fileContents: string, changeable: boolean, errorMessage: ?string}>}
 */
async function formatBlock(fileContents, blockName, parser) {
    let outcome = {fileContents, changeable: false, errorMessage: null}

    const blockBodyRegex = new RegExp('\n' + blockName + ' [{]\\n(.+?)\\n}\\n', 's')
    const match = fileContents.match(blockBodyRegex)
    if (match === null) {
        return outcome
    }
    const rawBody = match[1]

    // Remove 2-spaces of indentation, added due to being inside a Bru lang block
    let unindented = rawBody.replace(/^  /gm, '')

    if (blockName === 'body:json') {
        unindented = wrapNonStringPlaceholdersInDelimiters(unindented)
    }

    let prettierFormatted

    try {
        prettierFormatted = await prettier.format(
            unindented,
            Object.assign(prettierConfig, {parser})
        )
    } catch (e) {
        outcome.errorMessage = `Prettier could not format ${blockName} because...\n${e.message}`
        return outcome
    }

    if (blockName === 'body:json') {
        prettierFormatted = unwrapDelimitedPlaceholders(prettierFormatted)
    }

    const bodyLines = prettierFormatted.split('\n')

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
 * @returns {fileContents: string, changeable: boolean, errorMessage: ?string}
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
 * @returns {fileContents: string, changeable: boolean}
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
