import {readIfExists} from './files.mjs'

const configFilename = '.prettifybrurc'

/**
 * @typedef {Object} PrettifyBruConfig
 * @property {boolean} agnosticFilePaths
 * @property {boolean} shortenGetters
 * @property {Object} prettier Prettier options
 */

/** @type {PrettifyBruConfig} */
export const defaultConfig = {
    agnosticFilePaths: true,
    shortenGetters: true,
    prettier: {},
}

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

    const supportedProperties = {
        agnosticFilePaths: 'a boolean',
        shortenGetters: 'a boolean',
        prettier: 'an object',
    }
    Object.keys(fileConfig).forEach(key => {
        if (Object.hasOwn(supportedProperties, key)) {
            const value = fileConfig[key]
            const validType = supportedProperties[key]
            const validates = validators[validType]

            if (validates(value)) {
                config[key] = fileConfig[key]
            } else {
                console.warn(
                    `⚠️  \x1b[33m"${key}" is not correct type, it should be ${validType}\x1b[0m`
                )
            }
        } else {
            console.warn(`⚠️  \x1b[33mIgnoring unsupported property "${key}"\x1b[0m`)
        }
    })

    console.log(' ')

    return config
}

const validators = {
    'an object': value => {
        return value !== null && typeof value === 'object' && !Array.isArray(value)
    },
    'a boolean': value => {
        return typeof value === 'boolean'
    },
}
