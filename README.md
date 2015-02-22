# sixit

> Turn your vanilla Java Script into a Venti Iced Skinny Hazelnut Macchiato, Sugar-Free Syrup, Extra Shot, Light Ice, No Whip Script

Sort of like 6to5 except backwards. ES5 code goes in, ES6 code comes out.

![six it six it six it six it](/assets/sixit.gif)

## Usage

### Installing

```sh
npm install sixit
```

### Sixing your files

```js
sixit directory
```

### Programatically Using it

> `sixit(code: string, opts = {}: ?object): string`

```js
var sixit = require('sixit')
var magicalAwesomeCode = sixit(yourBoringCode)
```

## Options

The transforms are configurable. These are the available options along with their default values.
If an options object is passed to sixit it overrides all the options.

```js
{
  "arrow": false,
  "exports": false,
  "imports": false,
  "let": true,
  "method": true,
  "module": false,
  "shorthand": true,
  "strict": true
}
```

`arrow` transforms function expressions into arrow functions
`exports` transforms module.exports to export syntax
`imports` transforms require into import syntax
`let` converts all your vars into let
`method` converts methods in object expressions into concise form
`module` is a catch-all that does both import and export
`shorthand` converts properties that have the same key/value into concise
`strict` adds the use strict pragma at the top of the file

## License

[MIT](http://josh.mit-license.org)
