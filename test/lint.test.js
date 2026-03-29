import {describe, expect, it, jest} from '@jest/globals'
import {loadESLintEngine, lint} from '../lib/lint'
import {styleText} from 'node:util'

describe('loadESLintEngine()', () => {
    it('reports fatal error on invalid rules', async () => {
        const mockConsole = {error: jest.fn()}
        const invalidRules = {
            'no-tomato-in-burgers': 'error', // This is NOT a real ESLint rule
        }

        expect.assertions(3)
        return loadESLintEngine(mockConsole, invalidRules).then(loadEngineOutcome => {
            expect(loadEngineOutcome.fatalError).toEqual(true)
            expect(loadEngineOutcome.esLintEngine).toBeNull()
            expect(mockConsole.error).toHaveBeenCalledWith(
                `💥  ${styleText('red', `Key "esLintRules": Key "no-tomato-in-burgers": Could not find "no-tomato-in-burgers" in plugin "@".`)}`
            )
        })
    })

    it('reports fatal error on value for rule', async () => {
        const mockConsole = {error: jest.fn()}
        const invalidRules = {
            'no-console': 'warning', // "warning" is NOT a valid value
        }

        expect.assertions(3)
        return loadESLintEngine(mockConsole, invalidRules).then(loadEngineOutcome => {
            expect(loadEngineOutcome.fatalError).toEqual(true)
            expect(loadEngineOutcome.esLintEngine).toBeNull()
            expect(mockConsole.error).toHaveBeenCalledWith(
                `💥  ${styleText('red', `Config ".prettifybrurc": Key "esLintRules": Key "no-console": Expected severity of "off", 0, "warn", 1, "error", or 2.`)}`
            )
        })
    })

    it('honours esLintRules set to false', async () => {
        const mockConsole = {error: jest.fn()}
        const esLintRules = false // false means do not lint

        expect.assertions(3)
        return loadESLintEngine(mockConsole, esLintRules).then(loadEngineOutcome => {
            expect(loadEngineOutcome.fatalError).toEqual(false)
            expect(loadEngineOutcome.esLintEngine).toBeNull()
            expect(mockConsole.error).not.toHaveBeenCalled()
        })
    })
})

describe('The lint() function', () => {
    it('uses recommended ruleset', async () => {
        const mockConsole = {error: jest.fn()}
        const loadEngineOutcome = await loadESLintEngine(mockConsole, 'recommended')
        const esLintEngine = loadEngineOutcome.esLintEngine

        const code = [
            'const sausage = "Dog"', // Breaks no-unused-vars rule
            'var message = "Hello World"', // Breaks no-var rule
            'var message = "Howdy Earth"', // Breaks both the no-var and no-redeclare rules
            'console.log(message)', // Breaks the no-console rule
            'test("Response code is 200", function () {', // Breaks prefer-arrow-callback rule
            '  let status = res.status', // Breaks the prefer-const rule
            '  expect(status).to.be(200)',
            '})',
        ].join('\n')

        expect.assertions(1)
        return lint(code, esLintEngine).then(result => {
            expect(result.messages).toStrictEqual([
                {
                    fixable: true,
                    message:
                        "(1:7) 'sausage' is assigned a value but never used. Remove unused variable 'sausage'.",
                    severity: 2,
                },
                {
                    fixable: false,
                    message: '(2:1) Unexpected var, use let or const instead.',
                    severity: 2,
                },
                {
                    fixable: false,
                    message: '(3:1) Unexpected var, use let or const instead.',
                    severity: 2,
                },
                {
                    fixable: false,
                    message: "(3:5) 'message' is already defined.",
                    severity: 2,
                },
                {
                    fixable: true,
                    message: '(4:1) Unexpected console statement. Remove the console.log().',
                    severity: 2,
                },
                {
                    fixable: true,
                    message: '(5:30) Unexpected function expression. Use () => instead.',
                    severity: 1,
                },
                {
                    fixable: true,
                    message: "(6:7) 'status' is never reassigned. Use 'const' instead.",
                    severity: 1,
                },
            ])
        })
    })

    it('uses override ruleset containing only 1 warn-level', async () => {
        const mockConsole = {error: jest.fn()}
        const rules = {
            'no-console': 'warn',
        }

        const loadEngineOutcome = await loadESLintEngine(mockConsole, rules)
        const esLintEngine = loadEngineOutcome.esLintEngine

        const code = [
            'const sausage = "Dog"',
            'var message = "Hello World"',
            'console.log(message)',
        ].join('\n')

        expect.assertions(1)
        return lint(code, esLintEngine).then(result => {
            expect(result.messages).toStrictEqual([
                {
                    fixable: true,
                    message: '(3:1) Unexpected console statement. Remove the console.log().',
                    severity: 1,
                },
            ])
        })
    })
})
