#!/usr/bin/env node

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {main} from './lib/main';

const argv = yargs(hideBin(process.argv))
    .command('$0 [path] [-w|--write]', `Formats all .bru files (including subdirectories)`, (yargs) => {
        return yargs.positional('path', {
            describe: 'The root path to search from',
            type: 'string',
            demandOption: false,
            default: '',
            defaultDescription: 'Current working directory'
        })
    })
    .options({
        w: {
            alias: 'write',
            type: 'boolean',
            default: false,
        },
    })
    .describe({
        w: 'Write mode (Formats files in place, overwriting contents)',
        h: 'Display the help message',
    })
    .boolean(['w', 'h'])
    .alias('h', 'help')
    .parse();

if (argv.h) {
    yargs.showHelp();
} else {
    go(argv.path, argv.w);
}

function go(path, write) {
    main(process.cwd(), path, write).catch((err) => {
        console.error(err);
        process.exitCode = 1;
    });
}
