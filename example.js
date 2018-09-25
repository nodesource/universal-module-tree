'use strict'

const getTree = require('.')

const main = async () => {
  const tree = await getTree(__dirname)
  console.log(JSON.stringify(tree, null, 2))
}

main().catch(console.error)
