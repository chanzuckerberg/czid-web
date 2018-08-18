import NewickParser from "../parsers/NewickParser";

export default class Tree {
  constructor(root) {
    this.root = root;
  }

  static fromNewickString(newickString) {
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

    while (ancestors.length > 2) {
      let nodeToMove = ancestors.pop();
      // remove the next ancestor from children
      let previousAncestor = ancestors[ancestors.length - 1];
      this.detachFromParent(previousAncestor, nodeToMove);

      // set node's new distance
      nodeToMove.distance = previousAncestor.distance;
      previousAncestor.children.push(nodeToMove);
    }

    this.root = ancestors.pop();
    this.root.distance = 0;

    let nodeToRoot = ancestors.pop();
    this.root.children.forEach(node => {
      node.distance += nodeToRoot.distance;
    });
    nodeToRoot.distance = 0;
  }

  ancestors(root, nodeId) {
    if ((root.children || []).length === 0) {
      if (root.id === nodeId) {
        return [root];
      }
      return null;
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
