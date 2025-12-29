# Prettify Bruno Bru Files

A CLI tool to [prettify and format Bruno `.bru` files](https://www.npmjs.com/package/prettify-bru).

Uses [Prettier](https://prettier.io/) to impose a standard format on all blocks of JSON and JavaScript code across multiple [Bruno](https://www.usebruno.com/) `.bru` files in your project.

Handles the following block types:

- `body:json`
- `script:pre-request`
- `script:post-request`
- `tests`

All blocks are parsed using [Babel](https://babeljs.io/docs/babel-parser).

## Table of contents

<!-- TOC -->

- [Why use this?](#why-use-this)
- [Style choices](#style-choices)
- [Feedback](#feedback)
- [Installation](#installation)
- [How to use prettify-bru](#how-to-use-prettify-bru)
  - [Basic report](#basic-report)
  - [Fixing the files](#fixing-the-files)
  - [Limit to one directory](#limit-to-one-directory)
  - [Limit to one file](#limit-to-one-file)
  - [Limit to one block type](#limit-to-one-block-type)
  - [Complex example](#complex-example)
- [Automatically checking PRs](#automatically-checking-prs)
<!-- TOC -->

## Why use this?

If your team uses Git (or similar) to track and share your Bruno collections, nobody wants to waste time discussing cosmetic formatting! Your energy is better spent thinking about the actual tests.

If one person happens to use 4-space indentation but another person uses 2, there is a chance that PRs descend into a tug of war over time; Each subsequent pull request undoing the previous persons indentation, leading to dozens of unnecessary cosmetic changes that distract the reviewer from focussing on the important changes that actually have a material impact on what is being tested.

## Style choices

Thankfully, Bruno is already somewhat opinionated about code style so this project can follow its lead. In the desktop app, when editing a JSON body there is a "Prettify" button which always reformats JSON with 2-space indentation.

There is no adjascent option to reformat the "script" or "tests" tabs, so for JavaScript I've had to pick a set of style rules which I think most closely fit with what a QAer would want... familiar and short.

For JavaScript I've gone with the same 2-space indentation as JSON, no semi-colons at the end of lines for cleanliness and double-quotes for strings so you can copy and paste chunks between JavaScript and JSON without having to change all the quotes.

## Feedback

I have developed this package in my free time to help all the QA people living through the industry transition from being manual testers to becoming _Test Engineers_. If you're suddenly sharing hundreds of Bruno files with teammates, you all need to learn good Git etiquette. Code formatters can remove a lot of the stress.

Please use this package on your team's repos and give me any ideas, feedback or bug reports via the "Issues" tab on the Git repo https://github.com/martinjoiner/prettify-bru

Thanks, Martin

## Installation

Requires Node.js 20+

To install in your project, run:

```
npm i prettify-bru
```

Boom, now you should be ready to go!

## How to use `prettify-bru`

### Basic report

Get a non-destructive report of all files that could potentially be re-formatted by running:

```
npx prettify-bru
```

The above command will walk all subdirectories, finding `.bru` files and display a report. It will not modify the files.

### Fixing the files

To actually **modify** the files, I recommend committing your changes before doing this, add the `--write` option to the command:

```
npx prettify-bru --write
```

⚠️ Including the `--write` option will modify the files in place, use with caution.

### Limit to one directory

To limit the file search to a single subdirectory, provide the path as an argument. For example to search the folder named "speed-tests" do:

```
npx prettify-bru speed-tests
```

### Limit to one file

Similar to above example, you can also provide a specific filename:

```
npx prettify-bru speed-tests/get-all.bru
```

### Limit to one block type

Use the `--only` option to just operate on 1 block type and ignore the rest. For example to only assess the `body:json` blocks do:

```
npx prettify-bru --only body:json
```

### Complex example

Fix the formatting of just the `body:json` block in 1 specific file:

```
npm prettify-bru --write --only body:json speed-tests/get-all.bru
```

## Automatically checking PRs

You may want to configure Github workflows to run `prettify-bru` whenever a pull-request is raised. If the files are all formatted correctly the action will display in green, otherwise it will show as red to indicate the PR needs to be fixed.

This works because the `prettify-bru` command returns exit code 1 if it finds any files that contain an error or require reformatting. Otherwise it will return exit code 0.

Setup Github Workflows from the "Actions" tab of your repository.
