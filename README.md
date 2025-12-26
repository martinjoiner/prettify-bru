# Prettify Bruno Bru Files

A simple CLI tool to prettify the contents of [Bruno](https://www.usebruno.com/) `.bru` files. It uses [Prettier](https://prettier.io/) to consistently impose a standardised format to both JSON and JavaScript code, in all Bruno files in your project.

## Why use this?

If you use Git (or similar) to track your Bruno collections and share them with your team, nobody wants to waste time discussing cosmetic formatting! Your energy is better spent thinking about the actual tests. If one person happens to be in the habit of using 4-space indentation and adding semi-colons on the end of lines in JavaScript, but another person tends to use 2-space indentation and omits the semi-colons, there is a chance that PRs descend into a tug of war, each pull request containing a bunch of unnecessary cosmetic changes that draw the reviewer's attention away from the important changes that actually impact what is being tested.

Thankfully, Bruno is already somewhat opinionated about code style so this project can follow its lead. In the desktop app, when editing a JSON body on a request there is a "Prettify" button which always reformats JSON with 2-space indentation. There is no adjascent option to reformat the "script" or "tests" tabs, so for JavaScript I've had to pick a set of style rules which I think most closely fit with what a QAer would want... familiar and short. I've gone with the same 2-space indentation as JSON, no semi-colons at the end of lines for cleanliness and double-quotes for strings so you can copy and paste chunks between JavaScript and JSON.

This package is fairly young, I'm developing it in my free time to help the thousands of QA people living through the industry transition from being manual testers to becoming _test engineers_. They now need a lot of the same tools developers use to implement consistent style but they don't have the background of being developers.

Any feedback or bug reports are welcome, the Issues tab is open on the Git repo https://github.com/martinjoiner/prettify-bru

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

## CI Pipelines and Workflows

You may want to configure your CI Pipeline to run this command when a pull-request is raised. The `prettify-bru` command returns exit code 1 if it finds any files that contain an error or require reformatting. Otherwise it will return exit code 0.
