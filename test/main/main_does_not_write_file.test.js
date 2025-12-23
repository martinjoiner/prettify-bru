import {jest, test, expect} from '@jest/globals'

test('main() does not write file when write mode is false', async () => {
    jest.unstable_mockModule('../../lib/files.mjs', () => ({
        findFiles: jest.fn().mockName('mockFindFiles').mockReturnValue(['file.bru']),
        readFile: jest.fn().mockName('mockReadFile').mockReturnValue('mock content'),
        writeFile: jest.fn().mockName('mockWriteFile'),
    }));

    const {writeFile} = await import('../../lib/files.mjs');

    const {main} = await import('../../lib/main.mjs');

    const mockConsole = {log: jest.fn()}

    return main(mockConsole, '/home', 'bruno-collection', false).then(data => {
        expect(writeFile).not.toHaveBeenCalled();
    });
});
