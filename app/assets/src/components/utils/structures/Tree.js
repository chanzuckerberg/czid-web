import NewickParser from "../parsers/NewickParser";

export default class Tree {
  constructor(root, nodeData) {
    this.root = root;

    if (nodeData) {
      console.log("node data:");
      console.log(nodeData);
      let nodes = this.bfs();
      for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        console.log("node id: ", node.id);
        console.log("node name:");
        console.log(node.name);
        console.log(typeof node.name);
        if (nodeData[node.name]) {
          console.log("this node:");
          console.log(node);
          console.log("node data for this one:");
          console.log(nodeData[node.name]);
          node = Object.assign(node, nodeData[node.name]);
        }
        node.test = "hi";
        console.log("node:");
        console.log(node);
      }
    }

    console.log("foobar hi");
    console.log(this);
  }

  static fromNewickString(newickString, ...props) {
    if (!newickString) {
      return null;
    }
    console.log("NEWICK:");
    console.log(newickString);
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
