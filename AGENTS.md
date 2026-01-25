# Context

The purpose of this Node package named "prettify-bru" is to be used by many different people to automatically standardise the style of their Bruno collections (see https://www.usebruno.com/). This package aims to implement features that tidy style, shorten code where possible, improve readability and ensure files work in Bruno running on multiple operating systems. 

Suggest opportunities to improve this package by adding features that fix common code mistakes or shorten code.

# Structure of a Bruno Collection

Files that have a `.bru` extension (but are not named `collection.bru` or `folder.bru`) are configuration for network requests sent by the Bruno application.

The files are structured into multiple "blocks". The beginning of each block is indicated by a line with no indentation at the start, the block's name, a single space, a left curly-brace and a new line. Any following lines that are indented by 2 spaces are the contents of the block. Each block is terminated by a line with no indentation and a single right curly-brace character. 

The following snippet is an example of a block named "tests", where line 1 is the block opener, lines 2–4 are the contents and line 5 is the terminator:

```
tests {
  test("Response code is 200", () => {
    expect(res.status).to.eql(200)
  })
}
```

The code inside blocks named "tests" and "script:post-response" is JavaScript executed in an environment with the Chai Assertion Library, and as such they can call functions documented at https://www.chaijs.com/guide/styles/

The file named `bruno.json` is the metadata file that indicates the folder can be loaded by the Bruno application.

`collection.bru` contains general config about the Collection.

# Tracked example Bruno Collection

The `/bru-fixtures` folder contains an example of a genuine Bruno collection that I use for testing prettify-bru. Each file has some incorrect formatting that prettify-bru should be able to fix. The description of what we expect to be fixed is written in the "docs" block of each file.

# Executing locally

You can test prettify-bru locally by running `node cli.js` and it will find the collection in `/bru-fixtures` folder. (You will need to have run `npm install` once before).
