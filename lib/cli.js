var sixit = require('./')
var fs = require('fs')
var fu = require('fu')
var path = require('path')

function isDir(fullpath) {
  try {
    return fs.statSync(fullpath).isDirectory()
  } catch (ex) {
    if (ex.code == 'ENOENT') {
      console.error(String(ex))
    }
    return null
  }
}

function isJSFile(fileName) {
  return (/\.js$/).test(fileName)
}

function genFixForFile(file) {
  return function () {
    var content = fs.readFileSync(file).toString()
    var sixed = sixit(content)

    fs.writeFileSync(file, sixed, 'utf8')

    console.log('\u2713 ' + path.basename(file) + ' has been sixed.')

    return true
  }
}

function traverseFiles(fileName) {
  var fullpath = path.resolve(fileName)

  switch (isDir(fullpath)) {
    case true:
      return fu.concatMap(function (x) {
        return traverseFiles(path.join(fileName, x))
      }, fs.readdirSync(fullpath))
    case false:
      return isJSFile(fullpath)
        ? [genFixForFile(fullpath)]
        : []
    case null:
      return [fu.apply(function () { return false })]
  }
}

var SUCCESS = 0
var ERROR = 1

var fixFiles = fu.concatMap(traverseFiles, process.argv.slice(2))

process.exit(fu.foldl(function (statusCode, fn) {
  return fn()
    ? statusCode == ERROR ? ERROR : SUCCESS
    : ERROR
}, fixFiles, SUCCESS))
