class NewickParser {
  _lastId: $TSFixMe;
  _symbols: $TSFixMe;
  convertToUnrootedTree: $TSFixMe;
  newickString: $TSFixMe;
  nodeGroups: $TSFixMe;
  output: $TSFixMe;
  root: $TSFixMe;
  constructor(newickString: $TSFixMe) {
    // Internal
    this._lastId = 0;
    this._symbols = new Set("(),;");

    this.newickString = newickString;
    // @ts-expect-error ts-migrate(2554) FIXME: Expected 1-2 arguments, but got 0.
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

  createNode(name: $TSFixMe, distance = 0) {
    return { children: [], name, distance, id: this.getUniqueId() };
  }

  getNextTokenAndSymbol(idx: $TSFixMe) {
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
    const predecessors = [];
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
            // @ts-expect-error ts-migrate(2554) FIXME: Expected 1-2 arguments, but got 0.
            const newNode = this.createNode();
            currentNode.children.push(newNode);
            predecessors.push(currentNode);
            currentNode = newNode;
            break;
          }
          case ",":
            this.editNodeWithToken(currentNode, token);
            // @ts-expect-error ts-migrate(2554) FIXME: Expected 1-2 arguments, but got 0.
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

  editNodeWithToken(node: $TSFixMe, token: $TSFixMe) {
    const [name, distance, ...rest] = token.split(":");
    if (rest.length > 0) {
      throw new Error(`Bad token: ${token}`);
    }
    Object.assign(node, { name, distance: parseFloat(distance) });
  }

  lastNode() {
    const lastGroup = this.nodeGroups[this.nodeGroups.length - 1];
    return lastGroup[lastGroup.length - 1];
  }
}

export default NewickParser;
