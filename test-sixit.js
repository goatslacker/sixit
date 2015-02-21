var assert = require('assert')
var sixit = require('./sixit')

function run(o) {
  var actual = sixit(o.original)
  assert.equal(actual, o.expected)
}


run({
  subject: 'regular single imports',
  original: 'var _ = require("lodash");',
  expected: 'import _ from "lodash";',
})

run({
  subject: 'one-var style imports, var is converted to let',
  original: 'var _ = require("lodash"), a = 12;',
  expected: 'import _ from "lodash";\nlet a = 12;',
})

run({
  subject: 'let works too',
  original: 'let _ = require("lodash"), a = 12;',
  expected: 'import _ from "lodash";\nlet a = 12;',
})

run({
  subject: 'module.exports',
  original: 'module.exports = Foo;',
  expected: 'export default Foo;',
})

run({
  subject: 'convert object methods to concise',
  original: 'a = { b: function () { } }',
  expected: 'a = {\n  b() { }\n}',
})

run({
  subject: 'shorthand to concise',
  original: 'a = { a: a };',
  expected: 'a = {\n  a\n};',
})

run({
  subject: 'convert var to let',
  original: 'var foo = 1;',
  expected: 'let foo = 1;',
})
