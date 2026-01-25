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
            '  test("Is the response a 200", () => {',
            '    expect(res.status).to.equal(200)',
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
            expect(result.newContents).toBe(originalFileContents)
            expect(result.changeable).toBe(false)
            expect(result.errorMessages).toStrictEqual([])
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

    it('handles invalid JSON in body', async () => {
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

        const expected = [
            '',
            'body:json {',
            '  "this": "that",',
            '  "number": 7',
            '  }',
            '}',
            '',
        ].join('\n')

        expect.assertions(3)
        return format(originalFileContents).then(result => {
            expect(result.newContents).toBe(expected)
            expect(result.errorMessages).toStrictEqual([])
            expect(result.changeable).toBe(true)
        })
    })

    it('puts array items on separate lines in a JSON body', async () => {
        const originalFileContents = [
            '',
            'body:json {',
            '  {',
            '  "things": ["this", "that","other"]',
            '      ',
            '  }',
            '}',
            '',
        ].join('\n')

        const expected = [
            '',
            'body:json {',
            '  {',
            '    "things": [',
            '      "this",',
            '      "that",',
            '      "other"',
            '    ]',
            '  }',
            '}',
            '',
        ].join('\n')

        expect.assertions(3)
        return format(originalFileContents).then(result => {
            expect(result.newContents).toBe(expected)
            expect(result.errorMessages).toStrictEqual([])
            expect(result.changeable).toBe(true)
        })
    })

    it.each(['body:json', 'script:pre-request', 'script:post-response', 'tests'])(
        'strips out an empty %s block',
        async blockName => {
            const originalFileContents = [
                '',
                'docs {',
                '  Hello World',
                '}',
                '',
                `${blockName} {`,
                '}',
                '',
            ].join('\n')

            const expected = ['', 'docs {', '  Hello World', '}', ''].join('\n')

            expect.assertions(2)
            return format(originalFileContents).then(result => {
                expect(result.newContents).toBe(expected)
                expect(result.changeable).toBe(true)
            })
        }
    )

    it('removes excess whitespace and new lines between blocks', async () => {
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

    /* Coverage of respect for variable placeholders... */

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

    it('handles multiple lines with non-string placeholders and comments', async () => {
        // In an earlier version of the code, contents like this would get all mixed up with the
        // comments moved to a new line which then swallows up the next property and made a mess
        const originalContents = [
            '',
            'body:json {',
            '  {',
            '    "grapes": {{oneHundredItems}}, // These are the grapes',
            '    "moreGrapes": {{oneHundredItems}} // Another non-string placeholder',
            '  }',
            '}',
            '',
        ].join('\n')

        expect.assertions(2)
        return format(originalContents).then(result => {
            expect(result.newContents).toBe(originalContents)
            expect(result.changeable).toBe(false)
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

    /* Coverage of the `only` argument... */

    it('searches for all 4 blocks when `only` is null', async () => {
        expect.assertions(1)
        return format('file contents', null).then(result => {
            expect(result.blocksSearchedFor).toBe(4)
        })
    })

    it.each(['body:json', 'json', 'script:pre-request', 'pre-request'])(
        'searches for 1 block when `only` is set to "%s"',
        async only => {
            expect.assertions(1)
            return format('file contents', only).then(result => {
                expect(result.blocksSearchedFor).toBe(1)
            })
        }
    )

    /* Coverage of `config` argument... */

    it.each([
        [80, true],
        [100, true],
        [120, false],
    ])(
        'honours config (`prettier.printWidth` set to %s)',
        async (printWidth, expectedChangeable) => {
            const fileWithLinesOver100Chars = [
                '',
                'tests {',
                '  expect(res.body.user.name, "user.name is unexpected type").to.satisfy((v) => v === null || typeof v === "string")',
                '}',
                '',
            ].join('\n')

            // Only in the cases where it does change, this is what we expect it to change to
            const expectedChanged = [
                '',
                'tests {',
                '  expect(res.body.user.name, "user.name is unexpected type").to.satisfy(',
                '    (v) => v === null || typeof v === "string"',
                '  )',
                '}',
                '',
            ].join('\n')

            const config = printWidth === null ? {} : {prettier: {printWidth}}

            expect.assertions(2)
            return format(fileWithLinesOver100Chars, null, config).then(result => {
                if (expectedChangeable) {
                    expect(result.newContents).toBe(expectedChanged)
                } else {
                    expect(result.newContents).toBe(fileWithLinesOver100Chars)
                }
                expect(result.changeable).toBe(expectedChangeable)
            })
        }
    )

    /* Coverage of folder-separator replacement... */

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

    it('honours config (`agnosticFilePaths` set to false)', async () => {
        const originalFileContents = [
            'body:file {',
            '  file: @file(\\Jimbo\\Holiday Pics\\Beach.jpg) @contentType(image/jpeg)',
            '}',
            '',
        ].join('\n')

        const config = {agnosticFilePaths: false}

        expect.assertions(2)
        return format(originalFileContents, null, config).then(result => {
            expect(result.newContents).toBe(originalFileContents)
            expect(result.changeable).toBe(false)
        })
    })

    /* Coverage of shortenGetters feature... */

    it('replaces getters with property references', async () => {
        const originalFileContents = [
            '',
            'script:post-response {',
            '  console.log(res.getHeaders())',
            '  console.log(acres.getBody().farm)', // This line should not be changed
            '}',
            '',
            'tests {',
            '  console.log(req.getBody({raw: true}))', // This line should not be changed
            '  expect(res.getStatusText()).to.eql("OK")',
            '  expect(res.getStatus()).to.eql(200)',
            '  expect(res.getBody().name).to.eql("Dave")',
            '}',
            '',
        ].join('\n')

        const expected = [
            '',
            'script:post-response {',
            '  console.log(res.headers)',
            '  console.log(acres.getBody().farm)',
            '}',
            '',
            'tests {',
            '  console.log(req.getBody({raw: true}))',
            '  expect(res.statusText).to.eql("OK")',
            '  expect(res.status).to.eql(200)',
            '  expect(res.body.name).to.eql("Dave")',
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

    it('honours config (`shortenGetters` set to `false`)', async () => {
        const originalFileContents = [
            '',
            'script:post-response {',
            '  console.log(res.getHeaders())',
            '}',
            '',
            'tests {',
            '  expect(res.getBody().name).to.eql("Dave")',
            '}',
            '',
        ].join('\n')

        const config = {shortenGetters: false}

        expect.assertions(2)
        return format(originalFileContents, null, config).then(result => {
            expect(result.newContents).toBe(originalFileContents)
            expect(result.changeable).toBe(false)
        })
    })
})
