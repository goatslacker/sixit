module.exports = sixit

var esprima = require('esprima-fb')
var recast = require('recast')
var traverse = require('./traverse')

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

function isBind(node) {
  return node.callee.type === 'MemberExpression' &&
    (node.callee.object.type === 'FunctionExpression' || node.callee.object.type === 'ArrowFunctionExpression') &&
    node.callee.property.type === 'Identifier' &&
    node.callee.property.name === 'bind'
}

function sixit(code, opts) {
  var ast = recast.parse(code)

  var modified = traverse(ast, function (node, parent) {
    if (node.type === 'VariableDeclaration') {

      // require to import.
      if (opts.module || opts.imports) {
        var results = turnDeclarationsIntoImport(node.declarations)

        if (results.v.length) {
          return results.i.concat([{
            type: 'VariableDeclaration',
            declarations: results.v,
            kind: opts.let ? 'let' : node.kind
          }])
        } else {
          return results.i
        }

      // and var to let
      } else if (opts.let) {
        return {
          type: 'VariableDeclaration',
          declarations: node.declarations,
          kind: 'let'
        }
      } else {
        return node
      }

    // module.exports to export
    } else if ((opts.module || opts.exports) && isExport(node)) {
      return {
        type: 'ExportDeclaration',
        default: true,
        declaration: node.right
      }

    // object concise (shorthand + method)
    } else if ((opts.shorthand || opts.method) && node.type === 'ObjectExpression') {
      return conciseAllMethods(node, opts)

    } else if (opts.arrow && node.type === 'CallExpression') {
      if (isBind(node)) {
        return node.callee.object
      } else {
        return node
      }
    } else if (opts.arrow && node.type === 'FunctionExpression') {
      return {
        type: 'ArrowFunctionExpression',
        params: node.params,
        defaults: node.defaults,
        body: node.body,
        rest: node.rest
      }

    } else {
      return node
    }
  })

  // add use strict
  if (opts.strict && !isStrict(modified)) {
    addStrict(modified)
  }

  var generatedCode = recast.print(modified).code

  return generatedCode
}
