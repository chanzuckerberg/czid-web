class NewickParser {
  constructor(newickString) {
    // Internal
    this._lastId = 0;
    this._symbols = new Set("(),;");

    this.newickString = newickString;
    this.root = this.createNode();
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
      !this._symbols.has(this.newickString[idx])
    ) {
      token += this.newickString[idx++];
    }
    return { token: token.trim(), symbol: this.newickString[idx] };
  }

  parse() {
    let predecessors = [];
    let idx = this.newickString.indexOf("(");
    let currentNode = this.root;
    let terminate = false;
    try {
      while (!terminate && idx < this.newickString.length) {
        const { token, symbol } = this.getNextTokenAndSymbol(idx);
        switch (symbol) {
          case "(": {
            if (token.length > 0) {
              throw new Error("Name should not preceed '('");
            }
            let newNode = this.createNode();
            currentNode.children.push(newNode);
            predecessors.push(currentNode);
            currentNode = newNode;
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
            break;
          case ";":
            if (token.length > 0) {
              this.editNodeWithToken(currentNode, token);
            }
            break;
          default:
            throw new Error(`Bad tree format - bad symbol: ${symbol}`);
        }
        idx += token.length + 1;
        terminate = symbol === ";";
      }
    } catch (error) {
      // TODO: process error
      return null;
    }
    return this;
  }

  editNodeWithToken(node, token) {
    let [name, distance, ...rest] = token.split(":");
    if (rest.length > 0) {
      throw new Error(`Bad token: ${token}`);
    }
    Object.assign(node, { name, distance: parseFloat(distance) });
  }

  lastNode() {
    let lastGroup = this.nodeGroups[this.nodeGroups.length - 1];
    return lastGroup[lastGroup.length - 1];
  }
}

export default NewickParser;
