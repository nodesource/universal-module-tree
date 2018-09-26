'use strict'

const fs = require('fs')
const { promisify } = require('util')

class Node {
  constructor (data) {
    this.data = data
    this.children = []
  }
}

const getTree = async dir =>
  exists(`${dir}/package-lock.json`)
    ? getTreeFromPackageLock(dir)
    : exists(`${dir}/yarn.lock`)
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
        walk(treeChild, dependencyNode, packageLockNode)
      }
    }
  }

  for (const name of await getTopLevelDependencies(dir)) {
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
  throw new Error('TODO')
}

const getTreeFromNodeModules = async dir => {
  throw new Error('TODO')
}

const getTopLevelDependencies = async dir => {
  const pkg = await readJSON(`${dir}/package.json`)
  return new Set([
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
    ...Object.keys(pkg.optionalDependencies || {})
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
