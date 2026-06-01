#!/usr/bin/env node

import yargs from 'yargs'
import {hideBin} from 'yargs/helpers'
import {main} from './lib/main.mjs'
import {onlyParamOptions} from './lib/onlyParam.mjs'

const argv = yargs(hideBin(process.argv))
    .command(
        '$0 [path] [-w|--write] [--only "..."]',
        `Formats all .bru files (including subdirectories)`,
        yargs => {
            return yargs.positional('path', {
                describe: 'The root path to search from',
                type: 'string',
                demandOption: false,
                default: '',
                defaultDescription: 'Current working directory',
            })
        }
    )
    .options({
        only: {
            describe: 'Limit to only certain block types',
            type: 'string',
            choices: Object.keys(onlyParamOptions),
        },
        w: {
            describe: 'Write mode (Formats files in place, overwriting contents)',
            alias: 'write',
            type: 'boolean',
            default: false,
        },
        'json-formatter': {
            describe:
                'Use Prettier (instead of jsonc-parser) for body:json and body:graphql:vars blocks',
            type: 'string',
            choices: ['jsonc', 'prettier', null],
            default: null,
        },
    })
    .boolean(['w', 'h'])
    .alias('h', 'help')
    .parse()

if (argv.h) {
    yargs.showHelp()
} else {
    go(argv.path, argv.w, argv.only ?? null, argv['json-formatter'])
}

/**
 * @param {string} path
 * @param {boolean} write Whether to actually modify the files or not
 * @param {?string} only Limit to only the block type with a name containing value
 * @param {string} jsonFormatter Whether to use Prettier for JSON blocks
 */
function go(path, write, only, jsonFormatter) {
    const cliConfig = {}
    if (jsonFormatter !== null) {
        cliConfig.jsonFormatter = jsonFormatter
    }

    main(console, process.cwd(), path, write, only, cliConfig)
        .then(changesRequired => {
            if (changesRequired) {
                process.exitCode = 1
            }
        })
        .catch(err => {
            console.error(err)
            process.exitCode = 1
        })
}
