module.exports = sixit

var esprima = require('esprima-fb')
var recast = require('recast')

var fu = require('fu')

function traverse(o, f, p) {
  var k

  function make(parent) {
    return function (node) {
      var next = traverse(node, f, parent)
      next === node || (next._fixmyjs = 1)
      return next
    }
  }

  if (o === undefined) {
    return o
  }

  for (k in o) {
    var call = make(o)

    if (toString.call(o[k]) == '[object Object]') {
      o[k] = call(o[k])
    } else if (Array.isArray(o[k])) {
      o[k] = fu.concatMap(call, o[k])
    }
  }

  return f(o, p)
}


function isRequire(node) {
  return node.type === 'VariableDeclarator' &&
    node.init &&
    node.init.type === 'CallExpression' &&
    node.init.callee.type === 'Identifier' &&
    node.init.callee.name === 'require'
}

function isExport(node) {
  return node.type === 'AssignmentExpression' &&
    node.left.type === 'MemberExpression' &&
    node.left.object.type === 'Identifier' &&
    node.left.object.name === 'module' &&
    node.left.property.type === 'Identifier' &&
    node.left.property.name === 'exports'
}

function isShorthand(node) {
  return node.key.type === 'Identifier' &&
    node.key.type === node.value.type &&
    node.key.name === node.value.name
}

function turnDeclarationsIntoImport(declarations) {
  return declarations.reduce(function (obj, node) {
    if (isRequire(node)) {
      obj.i.push({
        type: 'ImportDeclaration',
        specifiers: [{
          type: 'ImportDefaultSpecifier',
          id: node.id
        }],
        source: {
          type: 'ModuleSpecifier',
          value: node.init.arguments[0].value
        }
      })
    } else {
      obj.v.push(node)
    }

    return obj
  }, { i: [], v: [] })
}

function conciseAllMethods(node, opts) {
  return {
    type: 'ObjectExpression',
    properties: node.properties.map(function (prop) {
      if (opts.method && prop.value.type === 'FunctionExpression') {
        prop.method = true
      } else if (opts.shorthand && isShorthand(prop)) {
        prop.shorthand = true
      }
      return prop
    })
  }
}

function isStrict(nodes) {
  return nodes.program &&
    nodes.program.body.length &&
    nodes.program.body[0].type === 'ExpressionStatement' &&
    nodes.program.body[0].expression.type === 'Literal' &&
    nodes.program.body[0].expression.value === 'use strict'
}

function addStrict(nodes) {
  nodes.program.body.unshift({
    type: 'ExpressionStatement',
    expression: {
      type: 'Literal',
      value: 'use strict'
    }
  })
}

function sixit(code, opts) {
  var ast = recast.parse(code)

  var modified = traverse(ast, function (node, parent) {

    // TODO
    // convert all functions to arrow functions? at least ones that define bind.
    // convert all string concatenation to template literal tags
    // TODO
    // make all these options configurable

    // require to import.
    // and var to let
    if (node.type === 'VariableDeclaration') {
      var results = turnDeclarationsIntoImport(node.declarations)

      if (results.v.length) {
        return results.i.concat([{
          type: 'VariableDeclaration',
          declarations: results.v,
          kind: 'let'
        }])
      } else {
        return results.i
      }

    // module.exports to export
    } else if (isExport(node)) {
      return {
        type: 'ExportDeclaration',
        default: true,
        declaration: node.right
      }

    // object concise (shorthand + method)
    } else if ((opts.shorthand || opts.method) && node.type === 'ObjectExpression') {
      return conciseAllMethods(node, opts)
    } else {
      return node
    }
  })

  if (opts.strict && !isStrict(modified)) {
    addStrict(modified)
  }

  var generatedCode = recast.print(modified).code

  return generatedCode
}
