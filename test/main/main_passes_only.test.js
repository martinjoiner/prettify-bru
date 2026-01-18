import {jest, test, expect} from '@jest/globals'

test('main() passes `only` parameter through to format()', async () => {
    jest.unstable_mockModule('../../lib/files.mjs', () => ({
        findFiles: jest.fn().mockName('mockFindFiles').mockReturnValue(['file.bru']),
        readFile: jest.fn().mockName('mockReadFile').mockReturnValue('mock original file contents'),
        readIfExists: jest.fn().mockName('mockReadIfExists').mockReturnValue(null),
        writeFile: jest.fn(),
    }))

    jest.unstable_mockModule('../../lib/format.mjs', () => ({
        format: jest.fn().mockName('mockformat').mockReturnValue({
            newContents: 'New file contents',
            changeable: 1,
            errorMessages: [],
        }),
    }))

    const {format} = await import('../../lib/format.mjs')

    const {main} = await import('../../lib/main.mjs')

    const mockConsole = {log: jest.fn()}

    return main(mockConsole, '/dir', 'collection', false, 'body:json').then(() => {
        expect(format).toHaveBeenCalledWith('mock original file contents', 'body:json', {})
    })
})
