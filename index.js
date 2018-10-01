'use strict'

const fs = require('fs')
const { promisify } = require('util')
const lockfile = require('@yarnpkg/lockfile')

class Node {
  constructor (data) {
    this.data = data
    this.children = []
  }
}

const getTree = async dir =>
  await exists(`${dir}/package-lock.json`)
    ? getTreeFromPackageLock(dir)
    : await exists(`${dir}/yarn.lock`)
      ? getTreeFromYarnLock(dir)
      : getTreeFromNodeModules(dir)

const getTreeFromPackageLock = async dir => {
  const tree = new Node()
  const packageLock = await readJSON(`${dir}/package-lock.json`)
  const pkgs = new Map()

  const walk = (treeNode, packageLockNode, packageLockParent) => {
    for (const name of Object.keys(packageLockNode.requires || {})) {
      const dependencyNode =
        (packageLockNode.dependencies || {})[name] ||
        (packageLockParent.dependencies || {})[name] ||
        packageLock.dependencies[name]
      dependencyNode.name = name

      const id = `${name}@${dependencyNode.version}`
      let treeChild
      if (pkgs.has(id)) {
        treeChild = pkgs.get(id)
        treeNode.children.push(treeChild)
      } else {
        treeChild = new Node({
          name,
          version: dependencyNode.version
        })
        pkgs.set(id, treeChild)
        treeNode.children.push(treeChild)
        const newPackageLockParent = (packageLockNode.dependencies || {})[name]
          ? packageLockNode
          : packageLockParent
        walk(treeChild, dependencyNode, newPackageLockParent)
      }
    }
  }

  for (const [name] of await getTopLevelDependencies(dir)) {
    const packageLockNode = packageLock.dependencies[name]
    packageLockNode.name = name
    const treeNode = new Node({
      name,
      version: packageLockNode.version
    })
    tree.children.push(treeNode)
    walk(treeNode, packageLockNode, packageLock)
  }

  return tree
}

const getTreeFromYarnLock = async dir => {
  const buf = await promisify(fs.readFile)(`${dir}/yarn.lock`)
  const yarnLock = lockfile.parse(buf.toString())
  const tree = new Node()
  const pkgs = new Map()

  const walk = treeNode => {
    const id = `${treeNode.data.name}@${treeNode.data.semver}`
    const yarnLockNode = yarnLock.object[id]

    for (const [name, semver] of Object.entries(yarnLockNode.dependencies || {})) {
      const id = `${name}@${semver}`
      const dependencyNode = yarnLock.object[id]
      dependencyNode.name = name

      let treeChild
      if (pkgs.has(id)) {
        treeChild = pkgs.get(id)
        treeNode.children.push(treeChild)
      } else {
        treeChild = new Node({
          name,
          version: dependencyNode.version,
          semver
        })
        pkgs.set(id, treeChild)
        treeNode.children.push(treeChild)
        walk(treeChild)
      }
    }
  }

  for (const [name, semver] of await getTopLevelDependencies(dir)) {
    const treeNode = new Node({
      name,
      version: yarnLock.object[`${name}@${semver}`].version,
      semver
    })
    tree.children.push(treeNode)
    walk(treeNode)
  }

  return tree
}

const getTreeFromNodeModules = async dir => {
  throw new Error('TODO')
}

const getTopLevelDependencies = async dir => {
  const pkg = await readJSON(`${dir}/package.json`)
  return new Set([
    ...Object.entries(pkg.dependencies || {}),
    ...Object.entries(pkg.devDependencies || {}),
    ...Object.entries(pkg.optionalDependencies || {})
  ])
}

const readJSON = async file => {
  const buf = await promisify(fs.readFile)(file)
  return JSON.parse(buf.toString())
}

const exists = async file => {
  try {
    await promisify(fs.stat)(file)
    return true
  } catch (_) {
    return false
  }
}

module.exports = getTree
