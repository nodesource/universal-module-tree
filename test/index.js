const { test } = require('tap')
const getTree = require('..')
const fs = require('fs')

test('getTree(dir)', async t => {
  const tree = await getTree(`${__dirname}/..`)
  t.ok(tree.children.length > 0, 'found dependencies')
})

test('getTree.fromPackageJSON', async t => {
  const tree = getTree.fromPackageLock({
    packageJSON: require('../package'),
    packageLock: require('../package-lock')
  })
  t.ok(tree.children.length > 0, 'found dependencies')
})

test('getTree.fromNodeModules', async t => {
  const tree = await getTree.fromNodeModules(`${__dirname}/..`)
  t.ok(tree.children.length > 0, 'found dependencies')
})

test('getTree.fromYarnLock', async t => {
  await t.test('this project', async t => {
    const tree = getTree.fromYarnLock({
      yarnLock: fs.readFileSync(`${__dirname}/yarn.lock`, 'utf8'),
      packageJSON: require('../package')
    })
    t.ok(tree.children.length > 0, 'found dependencies')
  })
  await t.test('react', async t => {
    const tree = getTree.fromYarnLock({
      yarnLock: fs.readFileSync(`${__dirname}/react/yarn.lock`, 'utf8'),
      packageJSON: require('./react/package')
    })
    t.ok(tree.children.length > 0, 'found dependencies')
  })
})

test('getTree.fromNSolid', async t => {
  const tree = getTree.fromNSolid(require('./nsolid'))
  t.ok(tree.children.length > 0, 'found dependencies')
})

test('getTree.flatten', async t => {
  const nodeA = {
    data: {
      name: 'a',
      version: '0'
    },
    children: [
      {
        data: {
          name: 'b',
          version: '0'
        },
        children: []
      }
    ]
  }
  t.deepEqual(getTree.flatten({
    children: [nodeA]
  }), [
    {
      name: 'a',
      version: '0',
      paths: [[]]
    },
    {
      name: 'b',
      version: '0',
      paths: [[nodeA]]
    }
  ])
})
