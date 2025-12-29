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
    ['script:post-request', 'babel'],
    ['tests', 'babel'],
]

/**
 * Uses Prettier to format blocks of JSON/JavaScript
 *
 * @param {string} originalContents The file contents as loaded from file system
 * @param {?string} only Limit to only the block type with a name containing value
 * @returns {Promise<{newContents: string, blocksSearchedFor: number, changeable: number, error_messages: string[]}>}
 */
export async function formatBlocks(originalContents, only = null) {
    let fileOutcome = {
        newContents: originalContents.replace(/\r\n/g, '\n'),
        blocksSearchedFor: 0,
        changeable: 0,
        error_messages: [],
    }

    let i
    for (i in formattableBlocks) {
        let [blockName, parser] = formattableBlocks[i]
        if (only !== null && !blockName.includes(only)) continue

        const blockOutcome = await formatBlock(fileOutcome.newContents, blockName, parser)
        fileOutcome.blocksSearchedFor++
        if (blockOutcome.error_message !== null) {
            fileOutcome.error_messages.push(blockOutcome.error_message)
        } else if (blockOutcome.changeable) {
            fileOutcome.changeable++
            fileOutcome.newContents = blockOutcome.fileContents
        }
    }

    return fileOutcome
}

/**
 * @param {string} fileContents
 * @param {string} blockName
 * @param {string} parser
 * @returns {Promise<{fileContents: string, changeable: boolean, error_message: ?string}>}
 */
async function formatBlock(fileContents, blockName, parser) {
    let outcome = {fileContents, changeable: false, error_message: null}

    const blockBodyRegex = new RegExp('\n' + blockName + ' [{]\\n(.+?)\\n}\\n', 's')
    const match = fileContents.match(blockBodyRegex)
    if (match === null) {
        return outcome
    }
    const rawBody = match[1]

    // Remove 2-spaces of indentation, added due to being inside a Bru lang Multimap
    const unindented = rawBody.replace(/^  /gm, '')

    let prettierFormatted

    try {
        prettierFormatted = await prettier.format(
            unindented,
            Object.assign(prettierConfig, {parser})
        )
    } catch (e) {
        outcome.error_message = `Prettier could not format ${blockName} because...\n${e.message}`
        return outcome
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
