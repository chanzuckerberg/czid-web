class NewickParser {
  constructor(newickString, debug = false) {
    this.newickString = newickString;
    this.debug = debug;

    this._lastId = 0;

    // Internal
    this.symbols = new Set("(),;");
    this.root = this.createNode();

    this.output = [];
  }

  debugOutput(debugString) {
    if (this.debug) this.output.push(debugString);
  }

  getUniqueId() {
    return this._lastId++;
  }

  getOutput() {
    return this.output;
  }

  getUnrootedTree() {
    return this.convertToUnrootedTree(this.root);
  }

  createNode(name, distance = 0) {
    return { children: [], name, distance, id: this.getUniqueId() };
  }

  getNextTokenAndSymbol(idx) {
    let token = "";
    while (
      idx < this.newickString.length &&
      !this.symbols.has(this.newickString[idx])
    ) {
      token += this.newickString[idx++];
    }
    return { token: token.trim(), symbol: this.newickString[idx] };
  }

  parse() {
    let predecessors = [];
    let idx = this.newickString.indexOf("(");
    let symbol = null;
    let currentNode = this.root;
    this.debugOutput(`parsing starting at ${idx}`);
    this.debugOutput(`Predecessors: ${JSON.stringify(predecessors, null, 2)}`);
    this.debugOutput("-----");

    try {
      while (idx < this.newickString.length && symbol !== ";") {
        const { token, symbol } = this.getNextTokenAndSymbol(idx);
        this.debugOutput(
          `elements: token[ ${token} ] symbol[ ${symbol} ], idx: ${idx}`
        );
        switch (symbol) {
          case "(": {
            if (token.length > 0) {
              throw new Error("Name should not preceed '('");
            }
            let newNode = this.createNode();
            currentNode.children.push(newNode);
            predecessors.push(currentNode);
            currentNode = newNode;
            this.debugOutput("=> Added new inner node");
            break;
          }
          case ",":
            this.editNodeWithToken(currentNode, token);
            currentNode = this.createNode();
            predecessors[predecessors.length - 1].children.push(currentNode);
            break;
          case ")":
            if (token.length > 0) {
              this.editNodeWithToken(currentNode, token);
            }
            currentNode = predecessors.pop();
            this.debugOutput(
              `=> Popped node: # nodes on stack = ${predecessors.length}`
            );
            break;
          case ";":
            if (token.length > 0) {
              this.editNodeWithToken(currentNode, token);
            }
            break;
          default:
            throw new Error("Do not know what to do");
        }
        idx += token.length + 1;
        this.debugOutput(
          `Predecessors: ${JSON.stringify(predecessors, null, 2)}`
        );
        this.debugOutput("-----");
      }
    } catch (error) {
      this.debugOutput(
        `ERROR (idx=${idx}) :: ${error.stack
          .split("\n")
          .splice(0, 2)
          .join("\n")}`
      );
    }

    this.debugOutput(`Final Tree: ${JSON.stringify(this.root, null, 2)}`);
    return this;
  }

  editNodeWithToken(node, token) {
    let [name, distance, ...rest] = token.split(":");
    if (rest.length > 0) {
      throw new Error(`Bad token: ${token}`);
    }
    Object.assign(node, { name, distance: parseFloat(distance) });
    this.debugOutput(`=> Edited node: ${name} ${distance}`);
  }

  lastNode() {
    let lastGroup = this.nodeGroups[this.nodeGroups.length - 1];
    return lastGroup[lastGroup.length - 1];
  }

  // convertToUnrootedTree(node, parentId) {
  //     let lastId = 0
  //     let nodes = {}

  //     function convertNode(node) {
  //         // console.log(node.name, nodeList, lastId)
  //         let newNode = {id: lastId++, name: node.name, distance: node.distance, inner: node.children.length > 0, edges: []}
  //         node.children.forEach(child => {
  //             let childNode = convertNode(child, newNode.id)

  //             childNode.edges.push(newNode.id)
  //             newNode.edges.push(childNode.id)
  //         })
  //         nodes[newNode.id] = newNode

  //         return newNode
  //     }

  //     convertNode(node, parentId)
  //     return nodes;
  // }

  // *dfs(nodes, rootId) {
  //     let stack = [];
  //     let visited = new Set();

  //     stack.push(rootId);
  //     while (stack.length > 0) {
  //         let nodeId = stack.pop();
  //         let node = nodes[nodeId];
  //         visited.add(nodeId);
  //         yield node;
  //         for (let neighborId in node.edges) {
  //             if (!visited.has(neighborId)) {
  //                 visited.add(neighborId);
  //             }
  //         }
  //     }
  // }
}

export default NewickParser;
