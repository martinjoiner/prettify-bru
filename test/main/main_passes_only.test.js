import {jest, test, expect} from '@jest/globals'

test('main() passes `only` parameter through to formatBlocks()', async () => {
    jest.unstable_mockModule('../../lib/files.mjs', () => ({
        findFiles: jest.fn().mockName('mockFindFiles').mockReturnValue(['file.bru']),
        readFile: jest.fn().mockName('mockReadFile').mockReturnValue('mock original file contents'),
        writeFile: jest.fn(),
    }));

    jest.unstable_mockModule('../../lib/format.mjs', () => ({
        formatBlocks: jest.fn().mockName('mockFormatBlocks').mockReturnValue({
            newContents: 'New file contents',
            changeable: 1,
            error_messages: []
        })
    }));

    const {formatBlocks} = await import('../../lib/format.mjs')

    const {main} = await import('../../lib/main.mjs')

    const mockConsole = {log: jest.fn()}

    return main(mockConsole, '/dir', 'collection', false, 'body:json').then(() => {
        expect(formatBlocks).toHaveBeenCalledWith('mock original file contents', 'body:json');
    });
});
