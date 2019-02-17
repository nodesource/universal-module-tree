# universal-module-tree

[![Build Status](https://travis-ci.org/nodesource/universal-module-tree.svg?branch=master)](https://travis-ci.org/nodesource/universal-module-tree)

Get a full module tree from `package-lock.json`, `yarn.lock` or `node_modules/**`.

## Usage

```js
const getTree = require('universal-module-tree')

const tree = await getTree(__dirname)
console.log(JSON.stringify(tree, null, 2))
```

```bash
$ node example.js | head -n25
{
  "children": [
    {
      "data": {
        "name": "@yarnpkg/lockfile",
        "version": "1.1.0"
      },
      "children": []
    },
    {
      "data": {
        "name": "read-package-tree",
        "version": "5.2.1"
      },
      "children": [
        {
          "data": {
            "name": "debuglog",
            "version": "1.0.1"
          },
          "children": []
        },
        {
          "data": {
            "name": "dezalgo",

```

## Installation

```bash
$ npm install universal-module-tree
```

## API

### getTree(dir) => `Promise`
### getTree.fromPackageLock({ packageLock, packageJSON }) => `Promise`
### getTree.fromYarnLock({ yarnLock, packageJSON }) => `Promise`
### getTree.fromNodeModules(path) => `Promise`
### getTree.flatten(tree) => `Array`

## License & copyright

Copyright &copy; NodeSource.

Licensed under the MIT open source license, see the LICENSE file for details.
