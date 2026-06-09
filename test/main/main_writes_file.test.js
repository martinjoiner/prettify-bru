import {jest, test, expect} from '@jest/globals'
import {styleText} from 'node:util'

test('main() writes file when write mode is true', async () => {
    jest.unstable_mockModule('../../lib/files.mjs', () => ({
        findFiles: jest
            .fn()
            .mockName('mockFindFiles')
            .mockReturnValue(['/home/bruno-collection/Simple GET Request.bru']),
        readFile: jest.fn().mockName('mockReadFile').mockReturnValue('mock file contents'),
        readIfExists: jest.fn().mockName('mockReadIfExists').mockReturnValue(null),
        writeFile: jest.fn().mockName('mockWriteFile'),
    }))

    const {readFile, writeFile} = await import('../../lib/files.mjs')

    jest.unstable_mockModule('../../lib/format.mjs', () => ({
        format: jest.fn().mockName('mockformat').mockReturnValue({
            newContents: 'New file contents',
            changeable: true,
            blockReports: [],
        }),
    }))

    jest.unstable_mockModule('../../lib/lint.mjs', () => ({
        loadESLintEngine: jest.fn().mockName('mockLoadESLintEngine').mockReturnValue({
            esLintEngine: null,
            fatalError: false,
        }),
    }))

    const {format} = await import('../../lib/format.mjs')

    const {main} = await import('../../lib/main.mjs')

    const mockConsole = {log: jest.fn()}

    return main(mockConsole, '/home', 'bruno-collection', true).then(() => {
        expect(readFile).toHaveBeenCalledTimes(1)
        expect(format).toHaveBeenCalledWith('mock file contents', null, {}, null, true)
        expect(writeFile).toHaveBeenCalledWith(
            '/home/bruno-collection/Simple GET Request.bru',
            'New file contents'
        )
        expect(mockConsole.log).toHaveBeenNthCalledWith(1, 'Inspected 1 file:')
        expect(mockConsole.log).toHaveBeenNthCalledWith(
            2,
            styleText('green', '  1 file had fixes applied 🪛')
        )
    })
})
