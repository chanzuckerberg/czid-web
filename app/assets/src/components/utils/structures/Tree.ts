import NewickParser from "../parsers/NewickParser";

export default class Tree {
  root: $TSFixMe;
  constructor(root: $TSFixMe, nodeData: $TSFixMe) {
    this.root = root;

    if (nodeData) {
      const nodes = this.bfs();
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
        if (nodeData[node.name]) {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
          Object.assign(node, nodeData[node.name]);
        }
      }
    }
  }

  static fromNewickString(newickString: $TSFixMe, ...props: $TSFixMe[]) {
    if (!newickString) {
      return null;
    }
    const parser = new NewickParser(newickString);
    parser.parse();
    // @ts-expect-error ts-migrate(2556) FIXME: Expected 2 arguments, but got 1 or more.
    return new Tree(parser.root, ...props);
  }

  detachFromParent(node: $TSFixMe, parent: $TSFixMe) {
    const childIndex = (parent.children || []).indexOf(node);
    parent.children.splice(childIndex, 1);
  }

  rerootTree(nodeId: $TSFixMe) {
    const ancestors = this.ancestors(this.root, nodeId);
    while (ancestors.length > 1) {
      const nodeToMove = ancestors.pop();

      // remove the next ancestor from children
      const previousAncestor = ancestors[ancestors.length - 1];
      this.detachFromParent(previousAncestor, nodeToMove);

      // set node's new distance
      [nodeToMove.distance, previousAncestor.distance] = [
        previousAncestor.distance,
        nodeToMove.distance,
      ];

      previousAncestor.children.push(nodeToMove);
    }
    this.root = ancestors.pop();
  }

  ancestors(root: $TSFixMe, nodeId: $TSFixMe) {
    if (root.id === nodeId) {
      return [root];
    }

    for (let i = 0; i < root.children.length; i++) {
      const node = root.children[i];
      const ancestorNodes = this.ancestors(node, nodeId);
      if (ancestorNodes) {
        ancestorNodes.push(root);
        return ancestorNodes;
      }
    }
    return null;
  }

  bfs() {
    const order = [];
    let stack = [this.root];

    while (stack.length > 0) {
      const node = stack.shift();
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
      order.push(node);
      stack = stack.concat(node.children);
    }
    return order;
  }
}
