# universal-module-tree

__WIP__

Get a full module tree from `package-lock.json`, `yarn.lock` or `node_modules/**`.

## Usage

```js
const getTree = require('@ns-private/universal-module-tree')

const tree = await getTree(__dirname)
console.log(JSON.stringify(tree, null, 2))
```

```bash
$ node example.js | head -n25
{
  "children": [
    {
      "data": {
        "name": "@ns-private/check-deps",
        "version": "2.0.0"
      },
      "children": [
        {
          "data": {
            "name": "dependency-check",
            "version": "3.2.1"
          },
          "children": [
            {
              "data": {
                "name": "builtins",
                "version": "2.0.0"
              },
              "children": [
                {
                  "data": {
                    "name": "semver",
                    "version": "5.5.1"
                  },
```

## Installation

```bash
$ npm install @ns-private/universal-module-tree
```

## API

### getTree(dir) => `Promise`
