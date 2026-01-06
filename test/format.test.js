import {describe, expect, it} from '@jest/globals'
import {format} from '../lib/format'

describe('The format() function', () => {
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
            "         console.log('Hello World');", // Too much indentation, wrong type of quotes and a semi-colon
            '    })',
            '}',
            '',
        ].join('\n')

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
        ].join('\n')

        expect.assertions(3)
        return format(originalFileContents).then(result => {
            expect(result.changeable).toBe(true)
            expect(result.errorMessages).toStrictEqual([])
            expect(result.newContents).toBe(expected)
        })
    })

    it('handles bru object methods', async () => {
        const originalFileContents = [
            '',
            'script:post-response {',
            '  bru.setEnvVar("userUuid", res.body.uuid)',
            '}',
            '',
        ].join('\n')

        expect.assertions(3)
        return format(originalFileContents).then(result => {
            expect(result.changeable).toBe(false)
            expect(result.errorMessages).toStrictEqual([])
            expect(result.newContents).toBe(originalFileContents)
        })
    })

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
        ].join('\n')

        expect.assertions(3)
        return format(originalFileContents).then(result => {
            expect(result.changeable).toBe(false)
            expect(result.errorMessages).toStrictEqual([])
            expect(result.newContents).toBe(originalFileContents)
        })
    })

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
        ].join('\n')

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
        ].join('\n')

        expect.assertions(3)
        return format(originalFileContents).then(result => {
            expect(result.changeable).toBe(true)
            expect(result.errorMessages).toStrictEqual([])
            expect(result.newContents).toBe(expected)
        })
    })

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
        ].join('\n')

        expect.assertions(2)
        return format(originalFileContents).then(result => {
            expect(result.changeable).toBe(false)
            expect(result.errorMessages[0]).toMatch(
                /^Prettier could not format body:json because...\nThe input should contain exactly one expression/
            )
        })
    })

    it('removes excess white space and new lines between blocks', async () => {
        const originalFileContents = [
            'meta {',
            '  name: Get Bananas',
            '}',
            '',
            '  ', // Surplus whitespace
            '', // Surplus new line
            'body:json {',
            '  {',
            '    "this": "that"',
            '  }',
            '}',
            '',
            '', // Surplus new line
            'tests {',
            '  console.log("Hello")',
            '}',
            '',
        ].join('\n')

        const expected = [
            'meta {',
            '  name: Get Bananas',
            '}',
            '',
            'body:json {',
            '  {',
            '    "this": "that"',
            '  }',
            '}',
            '',
            'tests {',
            '  console.log("Hello")',
            '}',
            '',
        ].join('\n')

        expect.assertions(2)
        return format(originalFileContents).then(result => {
            expect(result.changeable).toBe(true)
            expect(result.newContents).toBe(expected)
        })
    })

    it('reports valid files as not changeable', async () => {
        const originalFileContents = [
            'meta {',
            '  name: Get Bananas',
            '}',
            '',
            'body:json {',
            '  {',
            '    "this": "that"',
            '  }',
            '}',
            '',
            'tests {',
            '  console.log("Hello")',
            '}',
            '',
        ].join('\n')

        expect.assertions(1)
        return format(originalFileContents).then(result => {
            expect(result.changeable).toBe(false)
        })
    })

    it('knows non-string placeholders in body:json are not errors', async () => {
        const correctlyFormattedFileContents = [
            'meta {',
            '  name: Post Grapes',
            '}',
            '',
            'body:json {',
            '  {',
            '    "grapes": {{oneHundredItems}}', // A non-string placeholder has no double-quotes so it's not valid JSON
            '  }',
            '}',
            '',
            'script:pre-request {',
            '  const oneHundredItems = []',
            '  for (let i = 0; i < 100; i++) {',
            '    oneHundredItems.push({name: "Young Raisin"})',
            '  }',
            '  bru.setVar("oneHundredItems", oneHundredItems)',
            '}',
            '',
        ].join('\n')

        expect.assertions(3)
        return format(correctlyFormattedFileContents).then(result => {
            expect(result.changeable).toBe(false)
            expect(result.errorMessages).toStrictEqual([])
            expect(result.newContents).toBe(correctlyFormattedFileContents)
        })
    })

    it('handles multiple non-string placeholders in body:json', async () => {
        const badlyFormattedFileContents = [
            'meta {',
            '  name: Post Grapes',
            '}',
            '',
            'body:json {',
            '  {',
            '  "grapes":{{oneHundredItems}} , ', // A non-string placeholder has no double-quotes so it's not valid JSON
            '        "moreGrapes":    {{oneHundredItems}} ', // Another non-string placeholder
            '  }',
            '}',
            '',
            'script:pre-request {',
            '  const oneHundredItems = []',
            '  for (let i = 0; i < 100; i++) {',
            '    oneHundredItems.push({name: "Young Raisin"})',
            '  }',
            '  bru.setVar("oneHundredItems", oneHundredItems)',
            '}',
            '',
        ].join('\n')

        const expected = [
            'meta {',
            '  name: Post Grapes',
            '}',
            '',
            'body:json {',
            '  {',
            '    "grapes": {{oneHundredItems}},',
            '    "moreGrapes": {{oneHundredItems}}',
            '  }',
            '}',
            '',
            'script:pre-request {',
            '  const oneHundredItems = []',
            '  for (let i = 0; i < 100; i++) {',
            '    oneHundredItems.push({name: "Young Raisin"})',
            '  }',
            '  bru.setVar("oneHundredItems", oneHundredItems)',
            '}',
            '',
        ].join('\n')

        expect.assertions(3)
        return format(badlyFormattedFileContents).then(result => {
            expect(result.changeable).toBe(true)
            expect(result.errorMessages).toStrictEqual([])
            expect(result.newContents).toBe(expected)
        })
    })

    it('leaves string placeholders in body:json untouched', async () => {
        const badlyFormattedFileContents = [
            'meta {',
            '  name: Post Farmer',
            '}',
            '',
            'body:json {',
            '  {',
            '  "name": "{{name}}" ,  ', // This string placeholder should remain untouched as it is valid JSON
            '     "farmerName": "Farmer {{name}} Junior"', // This string placeholder should remain untouched as it is valid JSON
            '  }',
            '}',
            '',
        ].join('\n')

        const expected = [
            'meta {',
            '  name: Post Farmer',
            '}',
            '',
            'body:json {',
            '  {',
            '    "name": "{{name}}",',
            '    "farmerName": "Farmer {{name}} Junior"',
            '  }',
            '}',
            '',
        ].join('\n')

        expect.assertions(3)
        return format(badlyFormattedFileContents).then(result => {
            expect(result.changeable).toBe(true)
            expect(result.errorMessages).toStrictEqual([])
            expect(result.newContents).toBe(expected)
        })
    })

    it('searches for all 4 blocks when `only` is null', async () => {
        expect.assertions(1)
        return format('file contents', null).then(result => {
            expect(result.blocksSearchedFor).toBe(4)
        })
    })

    it.each(['body:json', 'json', 'script:pre-request', 'pre-request'])(
        'searches for 1 block when `only` is set',
        async only => {
            expect.assertions(1)
            return format('file contents', only).then(result => {
                expect(result.blocksSearchedFor).toBe(1)
            })
        }
    )

    it('replaces back-slashes with forward-slashes in @file path', async () => {
        const originalFileContents = [
            '',
            'body:file {',
            '  file: @file(\\Barry\\Tasteful Noodz\\Leopard Print.jpg) @contentType(image/jpeg)',
            '}',
            '',
            'other:file {',
            '  file: @file(\\Barry\\Tasteful Noodz\\Shark Hat.jpg) @contentType(image/jpeg)',
            '}',
            '',
        ].join('\n')

        const expected = [
            '',
            'body:file {',
            '  file: @file(/Barry/Tasteful Noodz/Leopard Print.jpg) @contentType(image/jpeg)',
            '}',
            '',
            'other:file {',
            '  file: @file(/Barry/Tasteful Noodz/Shark Hat.jpg) @contentType(image/jpeg)',
            '}',
            '',
        ].join('\n')

        expect.assertions(3)
        return format(originalFileContents).then(result => {
            expect(result.newContents).toBe(expected)
            expect(result.changeable).toBe(true)
            expect(result.errorMessages).toStrictEqual([])
        })
    })
})
