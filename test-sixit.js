var assert = require('assert')
var sixit = require('./')

var allOptions = {
  arrow: false,
  exports: false,
  imports: false,
  let: false,
  method: false,
  module: false,
  shorthand: false,
  strict: false
}

function run(test, opts) {
  Object.keys(allOptions).forEach(function (key) {
    opts[key] = opts[key] || allOptions[key]
  })
  var actual = sixit(test.original, opts)

  var subject = [
    test.subject,
    '',
    '// Expected',
    test.expected,
    '',
    '// Actual',
    actual,
    ''
  ].join('\n')

  assert.equal(actual, test.expected, subject)
}


run({
  subject: 'regular single imports',
  original: 'var _ = require("lodash");',
  expected: 'import _ from "lodash";',
}, { imports: true })

run({
  subject: 'regular single imports with module option',
  original: 'var _ = require("lodash");',
  expected: 'import _ from "lodash";',
}, { module: true })

run({
  subject: 'one-var style imports. imports are extracted',
  original: 'var _ = require("lodash"), a = 12;',
  expected: 'import _ from "lodash";\nvar a = 12;',
}, { imports: true })

run({
  subject: 'one-var style imports, var is converted to let',
  original: 'var _ = require("lodash"), a = 12;',
  expected: 'import _ from "lodash";\nlet a = 12;',
}, { imports: true, let: true })

run({
  subject: 'let works too, and let is left alone despite let conversion is false',
  original: 'let _ = require("lodash"), a = 12;',
  expected: 'import _ from "lodash";\nlet a = 12;',
}, { imports: true, let: false })

run({
  subject: 'module.exports for module',
  original: 'module.exports = Foo;',
  expected: 'export default Foo;;',
}, { module: true })

run({
  subject: 'module.exports for exports',
  original: 'module.exports = Foo;',
  expected: 'export default Foo;;',
}, { exports: true })

run({
  subject: 'do not convert module.exports',
  original: 'module.exports = Foo;',
  expected: 'module.exports = Foo;',
}, { exports: false })

run({
  subject: 'convert object methods to concise',
  original: 'a = { b: function () { } }',
  expected: 'a = {\n  b() { }\n}',
}, { method: true })

run({
  subject: 'does not convert object methods to concise on false',
  original: 'a = { b: function () { } }',
  expected: 'a = { b: function () { } }',
}, { method: false })

run({
  subject: 'shorthand to concise',
  original: 'a = { a: a };',
  expected: 'a = {\n  a\n};',
}, { shorthand: true })

run({
  subject: 'does not do shorthand',
  original: 'a = { a: a };',
  expected: 'a = { a: a };',
}, { shorthand: false })

run({
  subject: 'convert var to let',
  original: 'var foo = 1;',
  expected: 'let foo = 1;',
}, { let: true })

run({
  subject: 'empty init does not fail',
  original: 'var foo;',
  expected: 'let foo;',
}, { let: true })

run({
  subject: 'empty init no conversion',
  original: 'var foo;',
  expected: 'var foo;',
}, { let: false })

run({
  subject: 'adds use strict',
  original: '2;',
  expected: '"use strict";\n2;',
}, { strict: true })

run({
  subject: 'do not use strict',
  original: '2;',
  expected: '2;',
}, { strict: false })

run({
  subject: 'convert to arrow function',
  original: 'var a = function () {\n};',
  expected: 'var a = () => {\n};',
}, { arrow: true })

run({
  subject: 'do not convert to arrow function',
  original: 'var a = function () {\n};',
  expected: 'var a = function () {\n};',
}, { arrow: false })

run({
  subject: 'drop the bind',
  original: 'var a = function () {\n}.bind(this);',
  expected: 'var a = () => {\n};',
}, { arrow: true })
