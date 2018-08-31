import NewickParser from "../parsers/NewickParser";

export default class Tree {
  constructor(root) {
    this.root = root;
  }

  static fromNewickString(newickString) {
    if (!newickString) {
      return null;
    }
    let parser = new NewickParser(newickString);
    parser.parse();
    return new Tree(parser.root);
  }

  detachFromParent(node, parent) {
    let childIndex = (parent.children || []).indexOf(node);
    parent.children.splice(childIndex, 1);
  }

  rerootTree(nodeId) {
    let ancestors = this.ancestors(this.root, nodeId);
    while (ancestors.length > 1) {
      let nodeToMove = ancestors.pop();

      // remove the next ancetor from children
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
}
