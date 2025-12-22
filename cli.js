#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { go } from './index.js';

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
  go(argv.w, argv._[0]);
}
