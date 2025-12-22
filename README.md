# Prettify Bruno Bru Files

A simple CLI tool to prettify the contents of `.bru` files.

## Installation

To install in your project, run:

```
npm i prettify-bru
```

Boom, now you can get a non-destructive report of all the incorrect formatting by running:

```
npx prettify-bru
```

The above command will walk subdirectories, finding all `.bru` files. 
With each file it will assess the formatting of the JSON/JavsScript inside the following types of block:

- `body:json` will be parsed with the JSON parser
- `script:pre-request` blocks parsed with Babel
- `script:post-request` blocks parsed with Babel
- `tests` blocks parsed with Babel

To actually **modify** the files, I recommend committing your changes before doing this, run the command with the `--write` flag:

```
npx prettify-bru --write
```

⚠️ This will modify the files in place, use with caution.
