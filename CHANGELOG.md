# Change Log

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
