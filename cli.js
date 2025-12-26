#!/usr/bin/env node

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {main} from './lib/main.mjs';

const argv = yargs(hideBin(process.argv))
    .command('$0 [path] [-w|--write] [--only "..."]', `Formats all .bru files (including subdirectories)`, (yargs) => {
        return yargs.positional('path', {
            describe: 'The root path to search from',
            type: 'string',
            demandOption: false,
            default: '',
            defaultDescription: 'Current working directory'
        })
    })
    .options({
        only: {
            describe: 'Limit to only 1 block type',
            type: 'string',
            choices: ['body:json', 'json', 'script:pre-request', 'pre-request', 'script:post-request', 'post-request', 'tests']
        },
        w: {
            describe: 'Write mode (Formats files in place, overwriting contents)',
            alias: 'write',
            type: 'boolean',
            default: false,
        },
    })
    .boolean(['w', 'h'])
    .alias('h', 'help')
    .parse();

if (argv.h) {
    yargs.showHelp();
} else {
    go(argv.path, argv.w, argv.only ?? null);
}

/**
 * @param {string} path
 * @param {boolean} write Whether to actually modify the files or not
 * @param {?string} only Limit to only the block type with a name containing value
 */
function go(path, write, only) {
    main(console, process.cwd(), path, write, only)
    .then(changesRequired => {
        if (changesRequired) {
            process.exitCode = 1
        }
    })
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    });
}
