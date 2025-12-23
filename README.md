# Prettify Bruno Bru Files

A simple CLI tool to prettify the contents of `.bru` files.

## Installation

Requires Node.js 20+

To install in your project, run:

```
npm i prettify-bru
```

Boom, now you should be ready to go!

## Usage

Get a non-destructive report of all files that could potentially be re-formatted by running:

```
npx prettify-bru
```

The above command will walk all subdirectories finding `.bru` files. 
With each file it will assess the formatting of the JSON/JavaScript inside the following types of block:

- `body:json` will be parsed with the JSON parser
- `script:pre-request` blocks parsed with Babel
- `script:post-request` blocks parsed with Babel
- `tests` blocks parsed with Babel

To actually **modify** the files, I recommend committing your changes before doing this, run the command with the `--write` flag:

```
npx prettify-bru --write
```

⚠️ Including the `--write` option will modify the files in place, use with caution.

To just do a single subdirectory, provide the path as an argument, so search the folder names "speed-tests":

```
npx prettify-bru speed-tests
```

To just do 1 block type (for example just `body:json`), use the `--only` option:

```
npx prettify-bru --only body:json
```
