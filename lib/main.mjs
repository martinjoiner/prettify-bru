import {findFiles, readFile, writeFile} from './files.mjs'
import {format} from './format.mjs'
import {validateOnlyParam} from './onlyParam.mjs'
import {loadConfigFile} from './config.mjs'
import {styleText} from 'node:util'
import {loadESLintEngine} from './lint.mjs'

/**
 * Finds all .bru files and formats contents
 *
 * @param {Object} console The console to be used for outputting messages
 * @param {string} cwd Current working directory
 * @param {string} path
 * @param {boolean} write
 * @param {?string} only Limit to only the block type with a name containing value
 * @param {Object} cliConfig Configuration overrides from CLI flags
 * @returns {Promise<boolean>} True means some files contained errors or needed reformatting
 */
export async function main(console, cwd, path, write, only = null, cliConfig = {}) {
    validateOnlyParam(only)

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

    const config = {...loadConfigFile(console), ...cliConfig}

    let ruleset = 'recommended'
    if (Object.hasOwn(config, 'esLintRules')) {
        ruleset = config.esLintRules
        delete config.esLintRules
    }
    const loadEngineOutcome = await loadESLintEngine(console, ruleset)
    if (loadEngineOutcome.fatalError) {
        return true
    }
    const esLintEngine = loadEngineOutcome.esLintEngine

    const changeableFiles = []
    const erroredFiles = []
    let requireNothing = 0

    for (const filePath of files) {
        const outcome = await processFile(filePath, write, only, config, esLintEngine)

        let displayFilePath = filePath.replace(new RegExp('^' + cwd + '/'), '')

        if (outcome.changeable) {
            changeableFiles.push({displayFilePath, outcome})
        }
        if (outcome.blockReports.length) {
            erroredFiles.push({displayFilePath, outcome})
        }
        if (!outcome.changeable && outcome.blockReports.length === 0) {
            requireNothing++
        }
    }

    const changeableSuffix = write ? 'had fixes applied 🪛' : 'can have issues auto-fixed 🪛'
    let changeableReport = null
    const changeableColor = write ? 'green' : 'white'
    if (changeableFiles.length) {
        const emoji = write ? '✏️' : '👎️'
        const changeableFilesDesc = fileDesc(changeableFiles)
        changeableReport = `${changeableFilesDesc} ${changeableSuffix}`
    }

    let totalErrorCount = 0
    let erroredReport = null
    if (erroredFiles.length) {
        const erroredFilesDesc = fileDesc(erroredFiles)
        erroredReport = erroredFilesDesc + ' contained issues'
        console.warn(styleText(['red', 'underline'], `${erroredReport}:\n`))
        erroredFiles.forEach((r, i) => {
            console.warn(`${i + 1}) ${r.displayFilePath}\n`)
            r.outcome.blockReports.forEach(errs => {
                let log = '  '
                if (errs.blockName !== null) {
                    log += `${errs.blockName} block `
                }
                log += `has ${errs.issues.length} issue`
                log += errs.issues.length > 1 ? 's' : ''
                log += '...'
                errs.issues.forEach(err => {
                    if (err.severity === 2) {
                        totalErrorCount++
                    }
                    const icon = err.severity === 2 ? '❌' : '⚠️ '
                    const col = err.severity === 2 ? 'red' : 'yellowBright'
                    let fixable = ''
                    if (err.fixable) {
                        fixable = ' [🪛 '
                        fixable += write ? styleText('green', 'Fixed!') : 'Auto-fixable'
                        fixable += ']'
                    }
                    const indentedErrorMessage = err.message.replace(/\n/g, '\n       ')
                    log = `${log}\n    ${icon} ${styleText(col, indentedErrorMessage)}${fixable}`
                })
                console.warn(`${log} \n`)
            })
        })
    }

    const filesDesc = fileDesc(files)
    console.log(`Inspected ${filesDesc}:`)
    if (erroredReport) {
        console.log(styleText('red', `  ${erroredReport}`))
    }
    if (changeableReport) {
        console.log(styleText(changeableColor, `  ${changeableReport}`))
    }
    if (requireNothing > 0) {
        const requireNothingColor = requireNothing === files.length ? 'green' : 'dim'
        const requireNothingMessage = `${requireNothing} file` + (requireNothing > 1 ? 's' : '')
        console.log(
            `  ${styleText(requireNothingColor, `${requireNothingMessage} did not require any changes`)}`
        )
    }

    return totalErrorCount > 0
}

function fileDesc(files) {
    return `${files.length} file` + (files.length > 1 ? 's' : '')
}

/**
 * @param {string} filePath
 * @param {boolean} write
 * @param {?string} only Limit to only the block type with a name containing value
 * @param {Object} config
 * @param {?import('eslint').ESLint} esLintEngine
 * @returns {Promise<import('./format.mjs').FileOutcome>}
 */
async function processFile(filePath, write, only, config, esLintEngine) {
    const original = readFile(filePath)

    const fileOutcome = await format(original, only, config, esLintEngine, write)

    if (write && fileOutcome.changeable) {
        writeFile(filePath, fileOutcome.newContents)
    }

    return fileOutcome
}
