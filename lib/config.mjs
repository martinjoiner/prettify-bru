import {readIfExists} from './files.mjs'
import {styleText} from 'node:util'

const configFilename = '.prettifybrurc'

/**
 * @typedef {Object} PrettifyBruConfig
 * @property {boolean} agnosticFilePaths
 * @property {boolean} shortenGetters
 * @property {boolean|string[]} stripConsoleOutput
 * @property {Object} prettier Prettier options
 */

/** @type {PrettifyBruConfig} */
export const defaultConfig = {
    agnosticFilePaths: true,
    shortenGetters: true,
    stripConsoleOutput: ['log'],
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
            styleText('red', `Error parsing JSON in ${configFilename} config file:\n${e.message}\n`)
        )
        return {}
    }

    if (fileConfig instanceof Array || typeof fileConfig !== 'object') {
        console.error(
            styleText('red', `${configFilename} is not valid, the JSON is not an Object\n`)
        )
        return {}
    }

    console.log(`🔧 ${styleText('dim', `Using config file ${configFilename}`)}`)

    let config = {}

    const supportedProperties = {
        agnosticFilePaths: 'a boolean',
        shortenGetters: 'a boolean',
        stripConsoleOutput: 'a boolean or an array of strings',
        prettier: 'an object',
    }
    Object.keys(fileConfig).forEach(key => {
        if (Object.hasOwn(supportedProperties, key)) {
            const value = fileConfig[key]
            const validType = supportedProperties[key]
            const validator = validators[validType]

            const validationResult = validator(value, key)
            if (validationResult === true) {
                config[key] = fileConfig[key]
            } else {
                console.warn(`⚠️  ${styleText('yellow', validationResult)}`)
            }
        } else {
            console.warn(`⚠️  ${styleText('yellow', `Ignoring unsupported property "${key}"`)}`)
        }
    })

    console.log(' ')

    return config
}

const validators = {
    'an object': (value, key) => {
        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
            return true
        }
        return `"${key}" is not correct type, it should be an object`
    },
    'a boolean': (value, key) => {
        if (typeof value === 'boolean') {
            return true
        }
        return `"${key}" is not correct type, it should be a boolean`
    },
    'a boolean or an array of strings': (value, key) => {
        if (typeof value === 'boolean') {
            return true
        }
        if (Array.isArray(value)) {
            const validValues = ['log', 'warn', 'error']
            if (value.every(v => typeof v === 'string' && validValues.includes(v))) {
                return true
            }
            return `"${key}" as an array must only contain the strings "log", "warn" and "error"`
        }
        return `"${key}" is not correct type, it should be a boolean or an array of strings`
    },
}
