const id = node => `${node.data.name}@${node.data.version}`

const flatten = tree => {
  const pkgs = {}

  const walk = (node, path) => {
    let pkgObj
    if (pkgs[id(node)]) {
      pkgObj = pkgs[id(node)]
      pkgObj.paths.push(path)
    } else {
      pkgObj = {
        name: node.data.name,
        version: node.data.version,
        paths: [path]
      }
      pkgs[id(node)] = pkgObj
      for (const child of node.children) {
        walk(child, [...path, node])
      }
    }
  }

  for (const child of tree.children) {
    walk(child, [])
  }

  return Object.values(pkgs)
}

module.exports = flatten
