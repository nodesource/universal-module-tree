const { test } = require('tap')
const getTree = require('..')
const fs = require('fs')

test('getTree(dir)', async t => {
  const tree = await getTree(`${__dirname}/..`)
  t.ok(tree.children.length > 0, 'found dependencies')

  await t.test('noDev', async t => {
    const treeNoDev = await getTree(`${__dirname}/..`, { noDev: true })
    t.ok(tree.children.length > 0, 'found dependencies')
    t.ok(treeNoDev.children.length < tree.children.length, 'less dependencies')
  })

  await t.test('yarn', async t => {
    const tree = await getTree(`${__dirname}/react`)
    t.ok(tree.children.length > 0, 'found dependencies')
  })

  await t.test('node_modules', async t => {
    const tree = await getTree(`${__dirname}/node-modules`)
    t.ok(tree.children.length > 0, 'found dependencies')
  })
})

test('getTree.fromPackageJSON', async t => {
  const tree = getTree.fromPackageLock({
    packageJSON: require('../package'),
    packageLock: require('../package-lock')
  })
  t.ok(tree.children.length > 0, 'found dependencies')

  await t.test('noDev', async t => {
    const treeNoDev = getTree.fromPackageLock({
      packageJSON: require('../package'),
      packageLock: require('../package-lock'),
      noDev: true
    })
    t.ok(tree.children.length > 0, 'found dependencies')
    t.ok(treeNoDev.children.length < tree.children.length, 'less dependencies')
  })
})

test('getTree.fromNodeModules', async t => {
  const tree = await getTree.fromNodeModules(`${__dirname}/..`)
  t.ok(tree.children.length > 0, 'found dependencies')

  await t.test('noDev', async t => {
    const treeNoDev = await getTree.fromNodeModules(`${__dirname}/..`, { noDev: true })
    t.ok(tree.children.length > 0, 'found dependencies')
    t.ok(treeNoDev.children.length < tree.children.length, 'less dependencies')
  })
})

test('getTree.fromYarnLock', async t => {
  await t.test('this project', async t => {
    const tree = getTree.fromYarnLock({
      yarnLock: fs.readFileSync(`${__dirname}/yarn.lock`, 'utf8'),
      packageJSON: require('../package')
    })
    t.ok(tree.children.length > 0, 'found dependencies')

    await t.test('noDev', async t => {
      const treeNoDev = getTree.fromYarnLock({
        yarnLock: fs.readFileSync(`${__dirname}/yarn.lock`, 'utf8'),
        packageJSON: require('../package'),
        noDev: true
      })
      t.ok(tree.children.length > 0, 'found dependencies')
      t.ok(treeNoDev.children.length < tree.children.length, 'less dependencies')
    })

    await t.test('out of sync with package.json', async t => {
      const pkg = require('../package')
      const err = new Error('yarn.lock and package.json out of sync')
      err.code = 'YARN_LOCK_OUT_OF_SYNC'
      t.throws(() => {
        getTree.fromYarnLock({
          yarnLock: fs.readFileSync(`${__dirname}/yarn.lock`, 'utf8'),
          packageJSON: {
            ...pkg,
            dependencies: {
              ...pkg.dependencies,
              bloop: '1.0.0'
            }
          }
        })
      }, err)
    })
  })
  await t.test('react', async t => {
    const tree = getTree.fromYarnLock({
      yarnLock: fs.readFileSync(`${__dirname}/react/yarn.lock`, 'utf8'),
      packageJSON: require('./react/package')
    })
    t.ok(tree.children.length > 0, 'found dependencies')

    await t.test('noDev', async t => {
      const treeNoDev = getTree.fromYarnLock({
        yarnLock: fs.readFileSync(`${__dirname}/react/yarn.lock`, 'utf8'),
        packageJSON: require('./react/package'),
        noDev: true
      })
      t.ok(tree.children.length > 0, 'found dependencies')
      t.ok(treeNoDev.children.length < tree.children.length, 'less dependencies')
    })
  })
})

test('getTree.fromNSolid', async t => {
  await t.test('subfs', async t => {
    const tree = getTree.fromNSolid(require('./nsolid'))
    t.ok(tree.children.length > 0, 'found dependencies')
  })
  await t.test('no dependencies', async t => {
    const tree = getTree.fromNSolid([])
    t.ok(tree.children.length === 0, 'found no dependencies')
  })
})

test('getTree.flatten', async t => {
  let nodeB
  const nodeA = {
    data: {
      name: 'a',
      version: '0'
    },
    children: [
      nodeB = {
        data: {
          name: 'b',
          version: '0'
        },
        children: []
      }
    ]
  }
  nodeB.children.push(nodeA)
  t.deepEqual(getTree.flatten({
    children: [nodeA]
  }), [
    {
      name: 'a',
      version: '0',
      paths: [[], [nodeA, nodeB]]
    },
    {
      name: 'b',
      version: '0',
      paths: [[nodeA]]
    }
  ])
})
