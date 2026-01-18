import {findFiles, readFile, writeFile} from './files.mjs'
import {format} from './format.mjs'
import {loadConfigFile} from './config.mjs'

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
    if (changeableFiles.length) {
        const changeableCol = write ? '\x1b[32m' : '\x1b[33m'
        const emoji = write ? '✏️' : '⚠️'
        const changeableFilesDesc = fileDesc(changeableFiles)
        changeableReport = `${changeableCol}${changeableFilesDesc} ${changeableSuffix}`
        console.log(`\x1b[4m${changeableReport}:\x1b[0m\n`)
        changeableFiles.forEach(r =>
            console.log(`${emoji}  ${changeableCol}${r.displayFilePath}\x1b[0m`)
        )
        console.log(' ')
    }

    let erroredReport = null
    if (erroredFiles.length) {
        const erroredFilesDesc = fileDesc(erroredFiles)
        erroredReport = `\x1b[31m${erroredFilesDesc} causing errors`
        console.warn(`\x1b[4m${erroredReport}:\x1b[0m\n`)
        erroredFiles.forEach((r, i) => {
            console.warn(`${i + 1}) ${r.displayFilePath}\n`)
            r.outcome.errorMessages.forEach(err => {
                console.warn(`❌ \x1b[31m${err}\x1b[0m\n`)
            })
        })
    }

    const requireNothing = files.length - changeableFiles.length - erroredFiles.length
    const filesDesc = fileDesc(files)
    console.log(`Inspected ${filesDesc}:`)
    if (changeableReport) {
        console.log(`  ${changeableReport}\x1b[0m`)
    }
    if (erroredReport) {
        console.log(`  ${erroredReport}\x1b[0m`)
    }
    if (requireNothing > 0) {
        let requireNothingMessage = requireNothing === files.length ? '\x1b[32m' : '\x1b[2m'
        requireNothingMessage += `${requireNothing} file` + (requireNothing > 1 ? 's' : '')
        console.log(`  ${requireNothingMessage} did not require any changes`)
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
