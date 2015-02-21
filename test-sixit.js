var assert = require('assert')
var sixit = require('./')

var allOptions = {
  method: false,
  shorthand: false,
  strict: false
}

function run(test, opts) {
  opts = opts || allOptions
  var actual = sixit(test.original, opts)
  assert.equal(actual, test.expected)
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
  expected: 'export default Foo;;',
})

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
})

run({
  subject: 'empty init does not fail',
  original: 'var foo;',
  expected: 'let foo;',
})

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
