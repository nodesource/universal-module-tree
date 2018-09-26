'use strict'

const getTree = require('.')
const stringify = require('json-stringify-safe')

const main = async () => {
  const dir = process.argv[2] || __dirname
  const tree = await getTree(dir)
  console.log(stringify(tree, null, 2))
}

main().catch(console.error)
