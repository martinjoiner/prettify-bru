import {findFiles, readFile, writeFile} from './files.mjs'
import {format} from './format.mjs'
import {loadConfigFile} from './config.mjs'
import {styleText} from 'node:util'

/**
 * Finds all .bru files and formats contents
 *
 * @param {Object} console The console to be used for outputting messages
 * @param {string} cwd Current working directory
 * @param {string} path
 * @param {boolean} write
 * @param {?string} only Limit to only the block type with a name containing value
 * @returns {Promise<boolean>} True means some files contained errors or needed reformatting
 */
export async function main(console, cwd, path, write, only = null) {
    if (path === '') {
        path = cwd
    } else {
        // Append the relative path to the current working directory
        path = cwd + '/' + path
    }

    const files = findFiles(path)

    if (files.length === 0) {
        console.log('No .bru files found.')
        return false
    }

    const config = loadConfigFile(console)

    let changeableFiles = []
    let erroredFiles = []

    for (const filePath of files) {
        const outcome = await processFile(filePath, write, only, config)

        let displayFilePath = filePath.replace(new RegExp('^' + cwd + '/'), '')

        if (outcome.changeable) {
            changeableFiles.push({displayFilePath, outcome})
        } else if (outcome.errorMessages.length) {
            erroredFiles.push({displayFilePath, outcome})
        }
    }

    const changeableSuffix = write ? 'reformatted' : 'require reformatting'
    let changeableReport = null
    const changeableColor = write ? 'green' : 'yellow'
    if (changeableFiles.length) {
        const emoji = write ? '✏️' : '⚠️'
        const changeableFilesDesc = fileDesc(changeableFiles)
        changeableReport = `${changeableFilesDesc} ${changeableSuffix}`
        console.log(styleText([changeableColor, 'underline'], `${changeableReport}:\n`))
        changeableFiles.forEach(r =>
            console.log(`${emoji}  ${styleText(changeableColor, r.displayFilePath)}`)
        )
        console.log(' ')
    }

    let erroredReport = null
    if (erroredFiles.length) {
        const erroredFilesDesc = fileDesc(erroredFiles)
        erroredReport = `${erroredFilesDesc} causing errors`
        console.warn(styleText(['red', 'underline'], `${erroredReport}:\n`))
        erroredFiles.forEach((r, i) => {
            console.warn(`${i + 1}) ${r.displayFilePath}\n`)
            r.outcome.errorMessages.forEach(err => {
                console.warn(`❌ ${styleText('red', err)}\n`)
            })
        })
    }

    const requireNothing = files.length - changeableFiles.length - erroredFiles.length
    const filesDesc = fileDesc(files)
    console.log(`Inspected ${filesDesc}:`)
    if (changeableReport) {
        console.log(styleText(changeableColor, `  ${changeableReport}`))
    }
    if (erroredReport) {
        console.log(styleText('red', `  ${erroredReport}`))
    }
    if (requireNothing > 0) {
        const requireNothingColor = requireNothing === files.length ? 'green' : 'dim'
        const requireNothingMessage = `${requireNothing} file` + (requireNothing > 1 ? 's' : '')
        console.log(
            `  ${styleText(requireNothingColor, `${requireNothingMessage} did not require any changes`)}`
        )
    }

    return erroredFiles.length > 0 || changeableFiles.length > 0
}

function fileDesc(files) {
    return `${files.length} file` + (files.length > 1 ? 's' : '')
}

/**
 * @param {string} filePath
 * @param {boolean} write
 * @param {?string} only Limit to only the block type with a name containing value
 * @param {Object} config
 * @returns {Promise<FileOutcome>}
 */
async function processFile(filePath, write, only, config) {
    const original = readFile(filePath)

    const fileOutcome = await format(original, only, config)

    if (write && fileOutcome.changeable) {
        writeFile(filePath, fileOutcome.newContents)
    }

    return fileOutcome
}
