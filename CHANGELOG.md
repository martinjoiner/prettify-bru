# Change Log

## 1.9.1

Fixes bug affecting text output in environments that do not support text colourisation/styling. Another excellent contribution by [Pavel Kutáč](https://github.com/arxeiss) ([arxeiss](https://github.com/arxeiss)).

Fixes a few bugs in the implementation of the `only` param and expands it to support GraphQL blocks. Also adds documentation, see [Limit to only a subset of blocks](README.md#limit-to-only-a-subset-of-blocks).

## 1.9.0

New functionality expands the list of blocks that can be formatted to include `body:graphql` and `body:graphql:vars`.

❤️ Thank you to [Pavel Kutáč](https://github.com/arxeiss) ([arxeiss](https://github.com/arxeiss)) for this contribution.

## 1.8.0

New feature to shorten code by replacing uses of getters on the `res` object with property references where possible.

```javascript
expect(res.getStatus()).to.eql(200)
expect(res.getBody().name).to.eql("Dave")
```

The above will become...

```javascript
expect(res.status).to.eql(200)
expect(res.body.name).to.eql("Dave")
```

Added ability to configure `agnosticFilePaths` and `shortenGetters` features in the [config file](README.md#config-file).

Bug fix (introduced in 1.7.0): JSON bodies with comments were not formatted correctly.

## 1.7.0

New feature that strips out empty blocks. Added after discovering that if a request contains an empty block, it will not appear listed under the collection, effectively hiding it.

```
tests {
}
```

Empty blocks like the example above can accidentally creep in when `.bru` files are being edited directly through a code editor.

## 1.6.0

Adding the ability to create a `.prettifybrurc` file containing a JSON object. See [Config File section in README.md](README.md#config-file)

## 1.5.0

New agnostic file paths feature that replaces backslash folder separators in filenames with forward slashes so they work on Windows, Mac and Linux.

```
body:file {
  file: @file(\Images\Memes\3-Spidermen.jpg) @contentType(image/jpeg)
}
```

The above will be changed to...

```
body:file {
  file: @file(/Images/Memes/3-Spidermen.jpg) @contentType(image/jpeg)
}
```
