import {ESLint} from 'eslint'
import {defineConfig} from 'eslint/config'
import {styleText} from 'node:util'

const defaultRules = {
    'no-console': 'error',
    'no-redeclare': 'error',
    'no-sequences': 'error',
    'no-unused-vars': 'error',
    'no-var': 'error',
    'prefer-arrow-callback': 'warn',
    'prefer-const': 'warn',
}

/**
 * Uses ESLint to lint JavaScript
 *
 * @param {Object} console The console to be used for outputting messages
 * @param {('recommended'|Object|false)} rules ESLint rules
 * @return {Promise<{esLintEngine: ?ESLint, fatalError: boolean}>}
 */
export async function loadESLintEngine(console, rules) {
    const outcome = {esLintEngine: null, fatalError: false}

    if (rules === false) {
        return outcome
    }

    if (rules === 'recommended') {
        rules = {...defaultRules}
    }

    if (Object.keys(rules).length === 0) {
        return outcome
    }

    const options = {
        overrideConfigFile: true,
        overrideConfig: defineConfig({
            name: '.prettifybrurc',
            rules: rules,
        }),
    }

    const esLintEngine = new ESLint(options)

    // Test drive it with a lint to check the rules are valid
    try {
        await esLintEngine.lintText('function sayHello() { return "Hello" }')
    } catch (error) {
        const errorMessage = error.message.replace('Key "rules":', 'Key "esLintRules":')
        console.error(`💥  ${styleText('red', `${errorMessage}`)}`)
        outcome.fatalError = true
        return outcome
    }

    outcome.esLintEngine = esLintEngine

    return outcome
}

/**
 * Uses ESLint to lint JavaScript
 *
 * @param {string} code The ECMAScript/JavaScript to be linted
 * @param {ESLint} esLintEngine An instance of ESLint
 * @param {boolean} fix
 * @param {array} fixedMessages Messages from fixes already applied in outside recursions
 * @return {Promise<{messages: import('./format.mjs').Issue[], code: string}>}
 */
export async function lint(code, esLintEngine, fix, fixedMessages = []) {
    let outcome = {messages: [], code: code}

    const lintResults = await esLintEngine.lintText(code)

    for (const result of lintResults) {
        for (const m of result.messages) {
            if (
                m.ruleId === 'prefer-arrow-callback' &&
                m.message === 'Unexpected function expression.'
            ) {
                m.message += ' Use () => instead.'
            }
            // console.log(m)
            const fixResult = attemptFix(code, m)

            let message = `(${m.line}:${m.column}) ${m.message}`
            if (m.suggestions && m.suggestions.length) {
                message = `${message} ${m.suggestions[0].desc}`
            }
            const issue = {
                fixable: fixResult.fixable,
                message: message,
                severity: m.severity,
            }
            if (m.fatal === true) {
                issue.fatal = true
            }
            outcome.messages.push(issue)

            if (fixResult.fixable) {
                // Update the outcome with the fix
                outcome.code = fixResult.code

                if (fix) {
                    // Because this fix has modified the code we need to recursively call the linting
                    return lint(outcome.code, esLintEngine, fix, [
                        ...fixedMessages,
                        outcome.messages.pop(),
                    ])
                }
            }
        }
    }

    // Now we're passed the point of recursion, we know this is the final call so mix in the fixes from outside calls
    outcome.messages = [...outcome.messages, ...fixedMessages]

    return outcome
}

/**
 * @param {string} code
 * @param {Object} message A message from ESLint.LintResult.messages
 * @returns {{code: string, fixable: boolean}}
 */
function attemptFix(code, message) {
    const fix = findFix(message)

    if (fix === null) {
        return {code: code, fixable: false}
    }

    let fixed = applyFix(code, fix)

    // console.log('--------------')
    // console.log(message.line, fix)
    // console.log('--------------')
    // console.log(code)
    // console.log('--------------')
    // console.log(fixed)
    // console.log('--------------\n')

    return {code: fixed, fixable: true}
}

/**
 * @param {Object} message
 * @returns {?{text: string, range: number[]}}
 */
function findFix(message) {
    if (
        Object.hasOwn(message, 'suggestions') &&
        message.suggestions.length &&
        Object.hasOwn(message.suggestions[0], 'fix')
    ) {
        return message.suggestions[0].fix
    }

    if (Object.hasOwn(message, 'fix')) {
        return message.fix
    }

    return null
}

/**
 * @param {string} code
 * @param {{text: string, range: number[]}} fix
 * @returns {string}
 */
function applyFix(code, fix) {
    return code.substring(0, fix.range[0]) + fix.text + code.substring(fix.range[1])
}
