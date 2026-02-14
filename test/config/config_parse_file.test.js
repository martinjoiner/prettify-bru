import {jest, it, expect, describe} from '@jest/globals'
import {styleText} from 'node:util'
import {parseFile} from '../../lib/config.mjs'

describe('parseFile() function in config module', () => {
    it('logs when file contents is valid JSON Object', () => {
        const mockConsole = {log: jest.fn()}
        const config = parseFile(mockConsole, '{}')

        expect(mockConsole.log).toHaveBeenCalledWith(
            `🔧 ${styleText('dim', 'Using config file .prettifybrurc')}`
        )
        expect(config).toEqual({})
    })

    it.each(['"hello"', '[2,3]', '42'])('handles non-object JSON: %s', fileContents => {
        const mockConsole = {error: jest.fn()}
        const config = parseFile(mockConsole, fileContents)

        expect(mockConsole.error).toHaveBeenCalledWith(
            styleText('red', '.prettifybrurc is not valid, the JSON is not an Object\n')
        )
        expect(config).toEqual({})
    })

    it('handles empty object', () => {
        const mockConsole = {log: jest.fn()}
        const config = parseFile(mockConsole, '{}')

        expect(config).toEqual({})
    })

    it('warns if `agnosticFilePaths` is not a boolean', () => {
        const mockConsole = {log: jest.fn(), warn: jest.fn()}
        // This config incorrectly sets `agnosticFilePaths` property as an array
        const config = parseFile(mockConsole, '{"agnosticFilePaths": ["yes"]}')

        expect(mockConsole.warn).toHaveBeenCalledWith(
            `⚠️  ${styleText('yellow', '"agnosticFilePaths" is not correct type, it should be a boolean')}`
        )
        expect(config).toEqual({})
    })

    it('warns if `shortenGetters` is not a boolean', () => {
        const mockConsole = {log: jest.fn(), warn: jest.fn()}
        // This config incorrectly sets `shortenGetters` property as a string
        const config = parseFile(mockConsole, '{"shortenGetters": "yes"}')

        expect(mockConsole.warn).toHaveBeenCalledWith(
            `⚠️  ${styleText('yellow', '"shortenGetters" is not correct type, it should be a boolean')}`
        )
        expect(config).toEqual({})
    })

    it('warns if `prettier` is not an object', () => {
        const mockConsole = {log: jest.fn(), warn: jest.fn()}
        // This config incorrectly provides an array for the prettier property
        const config = parseFile(mockConsole, '{"prettier": ["tabWidth", 2]}')

        expect(mockConsole.warn).toHaveBeenCalledWith(
            `⚠️  ${styleText('yellow', '"prettier" is not correct type, it should be an object')}`
        )
        expect(config).toEqual({})
    })

    it('warns on unsupported properties', () => {
        const mockConsole = {log: jest.fn(), warn: jest.fn()}
        const config = parseFile(mockConsole, '{"fish": "horse"}')

        expect(mockConsole.warn).toHaveBeenCalledWith(
            `⚠️  ${styleText('yellow', 'Ignoring unsupported property "fish"')}`
        )
        expect(config).toEqual({})
    })

    it('transfers `agnosticFilePaths` property', () => {
        const mockConsole = {log: jest.fn()}
        const config = parseFile(mockConsole, '{"agnosticFilePaths": false}')

        expect(config).toEqual({agnosticFilePaths: false})
    })

    it('transfers `shortenGetters` property', () => {
        const mockConsole = {log: jest.fn()}
        const config = parseFile(mockConsole, '{"shortenGetters": false}')

        expect(config).toEqual({shortenGetters: false})
    })

    it('transfers `prettier` property', () => {
        const mockConsole = {log: jest.fn()}
        const config = parseFile(mockConsole, '{"prettier": {"semi": true}}')

        expect(config.prettier).toEqual({semi: true})
    })
})
