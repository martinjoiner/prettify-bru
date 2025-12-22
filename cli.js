#!/usr/bin/env node

import yargs from 'yargs';
import {hideBin} from 'yargs/helpers';
import {main} from './lib/main.js';

const argv = yargs(hideBin(process.argv))
    .usage(`
Usage: $0 [--write|-w] path

Running the command with no arguments will modify all files

`).options({
        w: {
            type: 'boolean',
            default: false
        },
        path: {
            default: '.',
        },
    })
    .describe({
        w: 'Write mode (Formats files in place, overwriting contents)',
        h: 'Display the help message',
    })
    .boolean(['w', 'h'])
    .help()
    .alias('h', 'help')
    .alias('w', 'write')
    .parse();

if (argv.h) {
    yargs.showHelp();
} else {
    go(argv._[0], argv.w);
}

function go(path, write) {
    main(process.cwd(), path, write).catch((err) => {
        console.error(err);
        process.exitCode = 1;
    });
}
