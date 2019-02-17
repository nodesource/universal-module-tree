const { test } = require('tap')
const getTree = require('.')
const fs = require('fs')

test('getTree(dir)', async t => {
  t.ok(await getTree(__dirname))
})

test('getTree.fromPackageJSON', async t => {
  t.ok(await getTree.fromPackageLock({
    packageJSON: require('./package'),
    packageLock: require('./package-lock')
  }))
})

test('getTree.fromNodeModules', async t => {
  t.ok(await getTree.fromNodeModules(__dirname))
})

test('getTree.fromYarnLock', async t => {
  t.ok(await getTree.fromYarnLock({
    yarnLock: fs.readFileSync(`${__dirname}/yarn.lock`, 'utf8'),
    packageJSON: require('./package')
  }))
})
