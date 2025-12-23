import {jest, test, expect} from '@jest/globals'

test('main() writes file when write mode is true', async () => {
    jest.unstable_mockModule('../../lib/files.mjs', () => ({
        findFiles: jest.fn().mockName('mockFindFiles').mockReturnValue(['/home/bruno-collection/Simple GET Request.bru']),
        readFile: jest.fn().mockName('mockReadFile').mockReturnValue('mock file contents'),
        writeFile: jest.fn().mockName('mockWriteFile'),
    }));

    const {readFile, writeFile} = await import('../../lib/files.mjs');

    jest.unstable_mockModule('../../lib/format.mjs', () => ({
        formatBlocks: jest.fn().mockName('mockFormatBlocks').mockReturnValue({
            newContents: 'New file contents',
            changeable: true,
            error_messages: []
        }),
    }));

    const {formatBlocks} = await import('../../lib/format.mjs')

    const {main} = await import('../../lib/main.mjs')

    const mockConsole = {log: jest.fn()}

    return main(mockConsole, '/home', 'bruno-collection', true).then(() => {
        expect(readFile).toHaveBeenCalledTimes(1);
        expect(formatBlocks).toHaveBeenCalledWith("mock file contents", null);
        expect(writeFile).toHaveBeenCalledWith('/home/bruno-collection/Simple GET Request.bru', 'New file contents');
    });
});
