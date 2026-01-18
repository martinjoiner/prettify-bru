import {jest, it, expect, describe} from '@jest/globals'
import {parseFile} from '../../lib/config.mjs'

describe('parseFile() function in config module', () => {
    it.each(['"hello"', '[2,3]', '42'])('handles non-object JSON: %s', fileContents => {
        const mockConsole = {error: jest.fn()}

        const config = parseFile(mockConsole, fileContents)

        expect(mockConsole.error).toHaveBeenCalled()
        expect(config).toEqual({})
    })

    it('handles empty object', () => {
        const mockConsole = {log: jest.fn()}

        const config = parseFile(mockConsole, '{}')

        expect(mockConsole.log).toHaveBeenCalled()
        expect(config).toEqual({})
    })

    it('warns on unsupported properties', () => {
        const mockConsole = {log: jest.fn(), warn: jest.fn()}

        const config = parseFile(mockConsole, '{"fish": "horse", "prettier": {}}')

        expect(mockConsole.log).toHaveBeenCalled()
        expect(mockConsole.warn).toHaveBeenCalled()
        expect(config).toEqual({prettier: {}})
    })

    it('passes prettier object', () => {
        const mockConsole = {log: jest.fn()}

        const config = parseFile(mockConsole, '{"prettier": {"semi": true}}')

        expect(mockConsole.log).toHaveBeenCalled()
        expect(config).toEqual({prettier: {semi: true}})
    })
})
