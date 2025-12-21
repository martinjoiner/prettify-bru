#!/usr/bin/env node

import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { go } from './index.js';

const argv = yargs(hideBin(process.argv))
.usage(`
Usage: $0 [-d] path

Running the command with no arguments will modify all files

`).options({
    d: {
      type: 'boolean',
      default: false
    },
    path: {
      default: '.',
    },
  })
  .describe({
    d: 'Dry-run (Files will not be modified)',
    h: 'Display this help message',
  })
  .boolean(['d', 'h'])
  .help()
  .alias('h', 'help')
  .alias('d', 'check')
  .alias('d', 'dry-run')
  .parse();

if (argv.h) {
  yargs.showHelp();
} else {
  go(argv.d, argv._[0]);
}
