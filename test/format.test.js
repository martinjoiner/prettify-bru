import {describe, expect, it} from '@jest/globals'
import {formatBlocks} from '../lib/format'

describe('The formatBlocks() function', function () {

    it('reformats JSON and JavaScript blocks', async () => {
        const originalFileContents = [
            'meta {',
            '  name: Test Test',
            '}',
            '',
            'body:json {',
            '  {',
            '      "this": "that",',
            '  "number": 7', // Badly indented
            '  }',
            '}',
            '',
            'script:pre-request {',
            '      go().then(() => {',
            '         console.log(\'Hello World\');', // Too much indentation and a semi-colon
            '    })',
            '}',
            '',
        ].join('\n');

        const expected = [
            'meta {',
            '  name: Test Test',
            '}',
            '',
            'body:json {',
            '  {',
            '    "this": "that",',
            '    "number": 7',
            '  }',
            '}',
            '',
            'script:pre-request {',
            '  go().then(() => {',
            '    console.log("Hello World")',
            '  })',
            '}',
            '',
        ].join('\n');

        expect.assertions(3);
        return formatBlocks(originalFileContents).then(result => {
            expect(result.changeable).toBe(true)
            expect(result.error_messages).toStrictEqual([])
            expect(result.newContents).toBe(expected)
        });
    });


    it('preserves indentation of comments in JavaScript', async () => {
        /*
        Covers a bug during development where if you don't properly handle the de-indenting before and
        re-indenting after, block-comments inside JavaScript will have additional indentation added on every run
        */

        const originalFileContents = [
            '',
            'tests {',
            '  test("Is the response a 200", function () {',
            '    expect(res.getStatus()).to.equal(200)',
            '  })',
            '  ',
            '  /*',
            '    test("Objects Contain Correct Variables", function() {})',
            '   */',
            '}',
            '',
        ].join('\n');

        expect.assertions(3);
        return formatBlocks(originalFileContents).then(result => {
            expect(result.changeable).toBe(false)
            expect(result.error_messages).toStrictEqual([])
            expect(result.newContents).toBe(originalFileContents)
        });
    });


    it('is not greedy when capturing blocks', async () => {
        // This covers a scenario during development where the regex capture groups were too greedy

        const originalFileContents = [
            '',
            'body:json {',
            '  {',
            '      "what": "where",',
            '  "goose": 12', // Badly indented
            '  }',
            '}',
            '',
            'untouchable {', // This block should not be reformatted
            '  {',
            '      "this": "that",',
            '  "number": 7',
            '  }',
            '}',
            '',
        ].join('\n');

        const expected = [
            '',
            'body:json {',
            '  {',
            '    "what": "where",',
            '    "goose": 12',
            '  }',
            '}',
            '',
            'untouchable {', // This block should remain badly indented
            '  {',
            '      "this": "that",',
            '  "number": 7',
            '  }',
            '}',
            '',
        ].join('\n');

        expect.assertions(3);
        return formatBlocks(originalFileContents).then(result => {
            expect(result.changeable).toBe(true)
            expect(result.error_messages).toStrictEqual([])
            expect(result.newContents).toBe(expected)
        });
    });


    it('reports invalid JSON', async () => {
        const originalFileContents = [
            '',
            'body:json {',
            // This JSON is missing an opening curly brace
            '      "this": "that",',
            '      "number": 7',
            '  }',
            '}',
            '',
        ].join('\n');

        expect.assertions(2);
        return formatBlocks(originalFileContents).then(result => {
            expect(result.changeable).toBe(false)
            expect(result.error_messages[0]).toMatch(/^Prettier could not format body:json because...\nThe input should contain exactly one expression/)
        });
    });

});
