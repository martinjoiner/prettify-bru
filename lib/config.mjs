import {readIfExists} from './files.mjs'

const configFilename = '.prettifybrurc'

/**
 *
 * @param {Object} console
 * @returns {Object}
 */
export function loadConfigFile(console) {
    const fileContents = readIfExists(configFilename)

    if (typeof fileContents !== 'string') {
        return {}
    }

    return parseFile(console, fileContents)
}

/**
 *
 * @param {Object} console
 * @param {string} fileContents
 * @returns {Object}
 */
export function parseFile(console, fileContents) {
    let fileConfig

    try {
        fileConfig = JSON.parse(fileContents)
    } catch (e) {
        console.error(
            `\x1b[31mError parsing JSON in ${configFilename} config file:\n${e.message}\x1b[0m\n`
        )
        return {}
    }

    if (fileConfig instanceof Array || typeof fileConfig !== 'object') {
        console.error(`\x1b[31m${configFilename} is not valid, the JSON is not an Object\x1b[0m\n`)
        return {}
    }

    console.log(`🔧 \x1b[2mUsing config file ${configFilename}\x1b[0m`)

    let config = {}

    const supportedProperties = ['prettier']
    Object.keys(fileConfig).forEach(key => {
        if (supportedProperties.includes(key)) {
            if (key === 'prettier') {
                const value = fileConfig[key]
                if (value === null || typeof value !== 'object' || Array.isArray(value)) {
                    console.warn(
                        `⚠️  \x1b[33mprettier is not correct type, it should be an object\x1b[0m`
                    )
                    return
                }
            }
            config[key] = fileConfig[key]
        } else {
            console.warn(`⚠️  \x1b[33m${key} is not a supported property\x1b[0m`)
        }
    })

    console.log(' ')

    return config
}
