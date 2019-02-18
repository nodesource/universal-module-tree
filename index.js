'use strict'

const fs = require('fs')
const { promisify } = require('util')
const lockfile = require('@yarnpkg/lockfile')
const readPackageTree = require('read-package-tree')
const assert = require('assert')
const flatten = require('./lib/flatten')
const { join } = require('path')

class Node {
  constructor (data) {
    this.data = data
    this.children = []
  }
}

const getTree = async dir =>
  await exists(`${dir}/package-lock.json`)
    ? getTreeFromPackageLock({
      packageLock: await readJSON(`${dir}/package-lock.json`),
      packageJSON: await readJSON(`${dir}/package.json`)
    })
    : await exists(`${dir}/yarn.lock`)
      ? getTreeFromYarnLock({
        yarnLock: await promisify(fs.readFile)(`${dir}/yarn.lock`, 'utf8'),
        packageJSON: await readJSON(`${dir}/package.json`)
      })
      : getTreeFromNodeModules(dir)

const getTreeFromPackageLock = ({ packageLock, packageJSON }) => {
  const tree = new Node()
  const pkgs = new Map()

  const walk = (treeNode, packageLockNode) => {
    for (const name of Object.keys(packageLockNode.requires || {})) {
      let dependenciesNode = packageLockNode
      while (!(dependenciesNode.dependencies || {})[name]) {
        dependenciesNode = dependenciesNode.parent
      }
      const dependencyNode = dependenciesNode.dependencies[name]
      dependencyNode.name = name
      if (!dependencyNode.parent) dependencyNode.parent = packageLockNode

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
        walk(treeChild, dependencyNode)
      }
    }
  }

  for (const [name] of getAllDependencies(packageJSON)) {
    const packageLockNode = packageLock.dependencies[name]
    if (!packageLockNode) continue
    packageLockNode.name = name
    packageLockNode.parent = packageLock
    const treeNode = new Node({
      name,
      version: packageLockNode.version
    })
    tree.children.push(treeNode)
    walk(treeNode, packageLockNode, packageLock)
  }

  return tree
}

const getTreeFromYarnLock = ({ yarnLock: yarnLockString, packageJSON }) => {
  const yarnLock = lockfile.parse(yarnLockString)
  const tree = new Node()
  const pkgs = new Map()

  const walk = treeNode => {
    const id = `${treeNode.data.name}@${treeNode.data.semver}`
    const yarnLockNode = yarnLock.object[id]
    const dependencies = yarnLockNode.dependencies || {}

    for (const [name, semver] of Object.entries(dependencies)) {
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

  for (const [name, semver] of getAllDependencies(packageJSON)) {
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
  const tree = new Node()
  const data = await promisify(readPackageTree)(dir)
  const pkgs = new Map()

  const walk = (treeNode, dataNode) => {
    const dependencies = dataNode === data
      ? getAllDependencies(dataNode.package)
      : Object.entries(dataNode.package.dependencies || {})
    for (const [name] of dependencies) {
      let dependenciesNode = dataNode
      while (!dependenciesNode.children.find(c => c.package.name === name)) {
        dependenciesNode = dependenciesNode.parent
      }
      const dependencyNode = dependenciesNode.children.find(c => c.package.name === name)

      const id = `${name}@${dependencyNode.package.version}`
      let treeChild
      if (pkgs.has(id)) {
        treeChild = pkgs.get(id)
        treeNode.children.push(treeChild)
      } else {
        treeChild = new Node({
          name,
          version: dependencyNode.package.version
        })
        pkgs.set(id, treeChild)
        treeNode.children.push(treeChild)
        walk(treeChild, dependencyNode)
      }
    }
  }

  for (const [name] of await getAllDependencies(readJSON(`${dir}/package.json`))) {
    const dataNode = data.children.find(c => c.package.name === name)
    assert(dataNode, 'Please run `npm install` first')
    const treeNode = new Node({
      name,
      version: dataNode.package.version
    })
    tree.children.push(treeNode)
    walk(treeNode, dataNode, data)
  }

  return tree
}

const getTreeFromNSolid = packages => {
  const tree = new Node()
  const pkgs = new Map()

  const walk = (treeNode, packagesNode) => {
    const dependencies = packagesNode.dependencies
    for (const dependencyPathRel of dependencies) {
      const dependencyPathAbs = join(packagesNode.path, dependencyPathRel)
      const dependencyNode = packages.find(pkg => pkg.path === dependencyPathAbs)

      const id = `${dependencyNode.name}@${dependencyNode.version}`
      let treeChild
      if (pkgs.has(id)) {
        treeChild = pkgs.get(id)
        treeNode.children.push(treeChild)
      } else {
        treeChild = new Node({
          name: dependencyNode.name,
          version: dependencyNode.version
        })
        pkgs.set(id, treeChild)
        treeNode.children.push(treeChild)
        walk(treeChild, dependencyNode)
      }
    }
  }
  walk(tree, packages[0])

  return tree
}

const getAllDependencies = pkg =>
  new Set([
    ...Object.entries(pkg.dependencies || {}),
    ...Object.entries(pkg.devDependencies || {}),
    ...Object.entries(pkg.optionalDependencies || {})
  ])

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
module.exports.fromPackageLock = getTreeFromPackageLock
module.exports.fromYarnLock = getTreeFromYarnLock
module.exports.fromNodeModules = getTreeFromNodeModules
module.exports.fromNSolid = getTreeFromNSolid
module.exports.flatten = flatten
