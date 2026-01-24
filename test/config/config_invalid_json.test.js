import {jest, test, expect} from '@jest/globals'

test('loadConfigFile() handles invalid JSON', async () => {
    jest.unstable_mockModule('../../lib/files.mjs', () => ({
        readIfExists: jest.fn().mockName('mockReadIfExists').mockReturnValue('{ '),
    }))

    const {readIfExists} = await import('../../lib/files.mjs')
    const {loadConfigFile} = await import('../../lib/config.mjs')

    const mockConsole = {error: jest.fn()}

    const config = loadConfigFile(mockConsole)

    expect(readIfExists).toHaveBeenCalledWith('.prettifybrurc')
    expect(mockConsole.error).toHaveBeenCalled()
    expect(config).toEqual({})
})
