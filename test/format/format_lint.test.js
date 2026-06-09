import {describe, expect, it, jest} from '@jest/globals'
import {loadESLintEngine} from '../../lib/lint'
import {format} from '../../lib/format'

describe('The format() calling lint() function', () => {
    it('with 1 ESLint rule', async () => {
        const fileContents = [
            'meta {',
            '  name: Call to licorice',
            '}',
            '',
            'body:json {',
            '  {',
            '    "style": "lace"',
            '  }',
            '}',
            '',
            'script:post-response {',
            '  var message = "Hello World"', // This unused var would fail the recommended ruleset, but not users custom ruleset
            '  console.log("Hello World")',
            '}',
            '',
        ].join('\n')

        const mockConsole = {error: jest.fn()}
        const loadEngineOutcome = await loadESLintEngine(mockConsole, {
            'no-console': 'error',
        })
        const esLintEngine = loadEngineOutcome.esLintEngine

        expect.assertions(2)
        return format(fileContents, null, {}, esLintEngine).then(result => {
            expect(result.changeable).toBe(true)
            expect(result.blockReports).toStrictEqual([
                {
                    blockName: 'script:post-response',
                    issues: [
                        {
                            fixable: true,
                            message:
                                '(2:1) Unexpected console statement. Remove the console.log().',
                            severity: 2,
                        },
                    ],
                },
            ])
        })
    })
})
