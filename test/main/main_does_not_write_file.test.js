import {jest, test, expect} from '@jest/globals'
import {styleText} from 'node:util'

test('main() does not write file when write mode is false', async () => {
    jest.unstable_mockModule('../../lib/files.mjs', () => ({
        findFiles: jest.fn().mockName('mockFindFiles').mockReturnValue(['file.bru']),
        readFile: jest.fn().mockName('mockReadFile').mockReturnValue('mock content'),
        readIfExists: jest.fn().mockName('mockReadIfExists').mockReturnValue(null),
        writeFile: jest.fn().mockName('mockWriteFile'),
    }))

    const {writeFile} = await import('../../lib/files.mjs')

    const {main} = await import('../../lib/main.mjs')

    const mockConsole = {log: jest.fn()}

    return main(mockConsole, '/home', 'bruno-collection', false).then(() => {
        expect(writeFile).not.toHaveBeenCalled()
        expect(mockConsole.log).toHaveBeenNthCalledWith(1, 'Inspected 1 file:')
        expect(mockConsole.log).toHaveBeenNthCalledWith(
            2,
            `  ${styleText('green', '1 file did not require any changes')}`
        )
    })
})
