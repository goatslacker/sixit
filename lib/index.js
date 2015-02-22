module.exports = sixit

var esprima = require('esprima-fb')
var recast = require('recast')
var traverse = require('./traverse')
var sixitConfig = require('../package.json').sixit

var _ = recast.types.builders
var $ = recast.types.namedTypes

function isRequire(node) {
  return (
    $.VariableDeclarator.check(node) &&
    node.init &&
    $.CallExpression.check(node.init) &&
    $.Identifier.check(node.init.callee) &&
    node.init.callee.name === 'require'
  )
}

function isExport(node) {
  return (
    $.AssignmentExpression.check(node) &&
    $.MemberExpression.check(node.left) &&
    $.Identifier.check(node.left.object) &&
    node.left.object.name === 'module' &&
    $.Identifier.check(node.left.property) &&
    node.left.property.name === 'exports'
  )
}

function isShorthand(node) {
  return (
    $.Identifier.check(node.key) &&
    node.key.type === node.value.type &&
    node.key.name === node.value.name
  )
}

function isStrict(nodes) {
  return (
    nodes.program &&
    nodes.program.body.length &&
    $.ExpressionStatement.check(nodes.program.body[0]) &&
    $.Literal.check(nodes.program.body[0].expression) &&
    nodes.program.body[0].expression.value === 'use strict'
  )
}

function isBind(node) {
  return (
    $.MemberExpression.check(node.callee) &&
    ($.FunctionExpression.check(node.callee.object) || $.ArrowFunctionExpression.check(node.callee.object)) &&
    $.Identifier.check(node.callee.property) &&
    node.callee.property.name === 'bind'
  )
}

function turnDeclarationsIntoImport(declarations) {
  return declarations.reduce(function (obj, node) {
    if (isRequire(node)) {
      obj.i.push(_.importDeclaration(
        [_.importDefaultSpecifier(node.id)],
        _.moduleSpecifier(node.init.arguments[0].value)
      ))
    } else {
      obj.v.push(node)
    }

    return obj
  }, { i: [], v: [] })
}

function conciseAllMethods(node, opts) {
  return _.objectExpression(
    node.properties.map(function (prop) {
      if (opts.method && $.FunctionExpression.check(prop.value)) {
        prop.method = true
      } else if (opts.shorthand && isShorthand(prop)) {
        prop.shorthand = true
      }
      return prop
    })
  )
}

function addStrict(nodes) {
  nodes.program.body.unshift(_.expressionStatement(
    _.literal('use strict')
  ))
}

function sixit(code, opts) {
  opts = opts || sixitConfig.options

  var ast = recast.parse(code)

  var modified = traverse(ast, function (node, parent) {
    if ($.VariableDeclaration.check(node)) {

      // require to import.
      if (opts.module || opts.imports) {
        var results = turnDeclarationsIntoImport(node.declarations)

        if (results.v.length) {
          return results.i.concat([
            _.variableDeclaration(
              opts.let ? 'let' : node.kind,
              results.v
            )
          ])
        } else {
          return results.i
        }

      // and var to let
      } else if (opts.let) {
        return _.variableDeclaration('let', node.declarations)
      } else {
        return node
      }

    // module.exports to export
    } else if ((opts.module || opts.exports) && isExport(node)) {
      return _.exportDeclaration(true, node.right)

      // TODO support exports.foo

    // object concise (shorthand + method)
    } else if ((opts.shorthand || opts.method) && $.ObjectExpression.check(node)) {
      return conciseAllMethods(node, opts)

    } else if (opts.arrow && $.CallExpression.check(node)) {
      if (isBind(node)) {
        return node.callee.object
      } else {
        return node
      }
    } else if (opts.arrow && $.FunctionExpression.check(node)) {
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
