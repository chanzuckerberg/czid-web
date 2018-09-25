import NewickParser from "../parsers/NewickParser";

export default class Tree {
  constructor(root, nodeData) {
    this.root = root;

    if (nodeData) {
      let nodes = this.bfs();
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        if (nodeData[node.name]) {
          Object.assign(node, nodeData[node.name]);
        }
      }
    }
  }

  static fromNewickString(newickString, ...props) {
    if (!newickString) {
      return null;
    }
    let parser = new NewickParser(newickString);
    parser.parse();
    return new Tree(parser.root, ...props);
  }

  detachFromParent(node, parent) {
    let childIndex = (parent.children || []).indexOf(node);
    parent.children.splice(childIndex, 1);
  }

  rerootTree(nodeId) {
    let ancestors = this.ancestors(this.root, nodeId);
    while (ancestors.length > 1) {
      let nodeToMove = ancestors.pop();

      // remove the next ancestor from children
      let previousAncestor = ancestors[ancestors.length - 1];
      this.detachFromParent(previousAncestor, nodeToMove);

      // set node's new distance
      [nodeToMove.distance, previousAncestor.distance] = [
        previousAncestor.distance,
        nodeToMove.distance
      ];

      previousAncestor.children.push(nodeToMove);
    }
    this.root = ancestors.pop();
  }

  ancestors(root, nodeId) {
    if (root.id === nodeId) {
      return [root];
    }

    for (let i = 0; i < root.children.length; i++) {
      let node = root.children[i];
      let ancestorNodes = this.ancestors(node, nodeId);
      if (ancestorNodes) {
        ancestorNodes.push(root);
        return ancestorNodes;
      }
    }
    return null;
  }

  bfs() {
    let order = [];
    let stack = [this.root];

    while (stack.length > 0) {
      let node = stack.shift();
      order.push(node);
      stack = stack.concat(node.children);
    }
    return order;
  }
}
