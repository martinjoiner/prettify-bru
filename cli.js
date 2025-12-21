#!/usr/bin/env node
const yargs = require('yargs')
	.usage(`
Usage: $0 [-d] path

Running the command with no arguments will modify all files

`).options({
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
  .alias('d', 'dry-run');

const argv = yargs.argv;

if (argv.h) {
  yargs.showHelp();
} else {
  go(argv.d, argv.path);
}

function go(argv) {
  const module = require('./index');

  module.go(argv.d, argv.path)
}
