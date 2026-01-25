import {jest, it, expect, describe} from '@jest/globals'
import {parseFile} from '../../lib/config.mjs'

describe('parseFile() function in config module', () => {
    it('logs when file contents is valid JSON Object', () => {
        const mockConsole = {log: jest.fn()}
        const config = parseFile(mockConsole, '{}')

        expect(mockConsole.log).toHaveBeenCalledWith(
            '🔧 \x1b[2mUsing config file .prettifybrurc\x1b[0m'
        )
        expect(config).toEqual({})
    })

    it.each(['"hello"', '[2,3]', '42'])('handles non-object JSON: %s', fileContents => {
        const mockConsole = {error: jest.fn()}
        const config = parseFile(mockConsole, fileContents)

        expect(mockConsole.error).toHaveBeenCalledWith(
            '\x1b[31m.prettifybrurc is not valid, the JSON is not an Object\x1b[0m\n'
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
            '⚠️  \x1b[33m"agnosticFilePaths" is not correct type, it should be a boolean\x1b[0m'
        )
        expect(config).toEqual({})
    })

    it('warns if `shortenGetters` is not a boolean', () => {
        const mockConsole = {log: jest.fn(), warn: jest.fn()}
        // This config incorrectly sets `shortenGetters` property as a string
        const config = parseFile(mockConsole, '{"shortenGetters": "yes"}')

        expect(mockConsole.warn).toHaveBeenCalledWith(
            '⚠️  \x1b[33m"shortenGetters" is not correct type, it should be a boolean\x1b[0m'
        )
        expect(config).toEqual({})
    })

    it('warns if `prettier` is not an object', () => {
        const mockConsole = {log: jest.fn(), warn: jest.fn()}
        // This config incorrectly provides an array for the prettier property
        const config = parseFile(mockConsole, '{"prettier": ["tabWidth", 2]}')

        expect(mockConsole.warn).toHaveBeenCalledWith(
            '⚠️  \x1b[33m"prettier" is not correct type, it should be an object\x1b[0m'
        )
        expect(config).toEqual({})
    })

    it('warns on unsupported properties', () => {
        const mockConsole = {log: jest.fn(), warn: jest.fn()}
        const config = parseFile(mockConsole, '{"fish": "horse"}')

        expect(mockConsole.warn).toHaveBeenCalledWith(
            '⚠️  \x1b[33mIgnoring unsupported property "fish"\x1b[0m'
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
