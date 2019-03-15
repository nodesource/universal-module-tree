'use strict'

const getTree = require('.')
const stringify = require('json-stringify-safe')
const minimist = require('minimist')

const main = async () => {
  const argv = minimist(process.argv.slice(2))
  const dir = argv._[0] || __dirname
  const noDev = argv.noDev || argv['no-dev']
  const tree = await getTree(dir, { noDev })
  console.log(stringify(tree, null, 2))
}

main().catch(console.error)
