import {jest, test, expect} from '@jest/globals'

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
            errorMessages: [],
        }),
    }))

    const {format} = await import('../../lib/format.mjs')

    const {main} = await import('../../lib/main.mjs')

    const mockConsole = {log: jest.fn()}

    return main(mockConsole, '/home', 'bruno-collection', true).then(() => {
        expect(readFile).toHaveBeenCalledTimes(1)
        expect(format).toHaveBeenCalledWith('mock file contents', null, {})
        expect(writeFile).toHaveBeenCalledWith(
            '/home/bruno-collection/Simple GET Request.bru',
            'New file contents'
        )
    })
})
