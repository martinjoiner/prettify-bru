import {readIfExists} from './files.mjs'
import {styleText} from 'node:util'

const configFilename = '.prettifybrurc'

/**
 * @typedef {Object} PrettifyBruConfig
 * @property {boolean} agnosticFilePaths
 * @property {boolean} shortenGetters
 * @property {'jsonc-parser'|'prettier'} jsonFormatter
 * @property {Object} prettier Prettier options
 * @property {('recommended'|Object|false)} esLintRules ESLint rules configuration
 */

/** @type {PrettifyBruConfig} */
export const defaultConfig = {
    agnosticFilePaths: true,
    shortenGetters: true,
    jsonFormatter: 'jsonc-parser',
    prettier: {},
    esLintRules: 'recommended',
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
        jsonFormatter: 'jsonc-parser or prettier',
        prettier: 'an object',
        esLintRules: ['the string "recommended"', 'an object', 'false'],
    }
    Object.keys(fileConfig).forEach(key => {
        if (Object.hasOwn(supportedProperties, key)) {
            const value = fileConfig[key]
            let validTypes = supportedProperties[key]

            if (!Array.isArray(validTypes)) {
                validTypes = [validTypes]
            }

            if (validate(validTypes, value)) {
                config[key] = fileConfig[key]
            } else {
                console.warn(
                    `⚠️  ${styleText('yellow', `"${key}" is not correct type, it should be ${validTypes.join(' or ')}`)}`
                )
            }
        } else {
            console.warn(`⚠️  ${styleText('yellow', `Ignoring unsupported property "${key}"`)}`)
        }
    })

    if (!Object.hasOwn(fileConfig, 'esLintRules')) {
        console.log(
            `   ${styleText('dim', `"esLintRules" is not set. Defaulting to recommended ruleset.`)}`
        )
    }

    console.log(' ')

    return config
}

function validate(validTypes, value) {
    for (const validType of validTypes) {
        const validator = validators[validType]
        if (validator(value) === true) {
            return true
        }
    }
    return false
}

const validators = {
    'an object': value => {
        return value !== null && typeof value === 'object' && !Array.isArray(value)
    },
    'a boolean': value => {
        return typeof value === 'boolean'
    },
    'jsonc-parser or prettier': value => value === 'jsonc-parser' || value === 'prettier',
    false: value => value === false,
    'the string "recommended"': value => value === 'recommended',
}
