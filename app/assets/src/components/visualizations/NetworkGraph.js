import { DataSet, Network } from "visjs-network";

export default class NetworkGraph {
  constructor(container, nodeData, edgeData, options) {
    const { onClick, onNodeHover, onNodeBlur, ...networkOptions } = options;
    this.data = {
      nodes: new DataSet(nodeData),
      edges: new DataSet(edgeData),
    };
    this.graph = new Network(container, this.data, networkOptions);

    this.graph.on("click", onClick);
    this.graph.on("hoverNode", onNodeHover);
    this.graph.on("blurNode", onNodeBlur);
  }

  moveNodeToPosition(nodeId, xDOMCoord, yDOMCoord) {
    const canvasCoords = this.graph.DOMtoCanvas({ x: xDOMCoord, y: yDOMCoord });
    this.graph.moveNode(nodeId, canvasCoords.x, canvasCoords.y);
  }

  getNodePosition(nodeId) {
    const canvasCoords = this.graph.getPositions([nodeId])[nodeId];
    return this.graph.canvasToDOM(canvasCoords);
  }

  getEdges(filter) {
    return this.data.edges.getIds({ filter: filter });
  }

  updateEdges(edgeIds, options) {
    edgeIds.forEach(edgeId => {
      this.data.edges.update({ id: edgeId, ...options });
    });
  }

  updateNodes(nodeIds, options) {
    nodeIds.forEach(nodeId => {
      this.data.nodes.update({ id: nodeId, ...options });
    });
  }

  getNodeAt(xDOMCoord, yDOMCoord) {
    return this.graph.getNodeAt({ x: xDOMCoord, y: yDOMCoord });
  }

  getEdgeAt(xDOMCoord, yDOMCoord) {
    return this.graph.getEdgeAt({ x: xDOMCoord, y: yDOMCoord });
  }

  minimizeSizeGivenScale(scale) {
    // Set initial zoom for width calculation.
    this.graph.moveTo({ scale: scale });

    // Compute minimum and maximum x coordinates of nodes.
    let minCanvasX = Number.MAX_VALUE;
    let maxCanvasX = Number.MIN_VALUE;
    let minCanvasY = Number.MAX_VALUE;
    let maxCanvasY = Number.MIN_VALUE;
    this.data.nodes.getIds().forEach(nodeId => {
      const boundingBox = this.graph.getBoundingBox(nodeId);
      minCanvasX = Math.min(minCanvasX, boundingBox.left);
      maxCanvasX = Math.max(maxCanvasX, boundingBox.right);
      minCanvasY = Math.min(minCanvasY, boundingBox.top);
      maxCanvasY = Math.max(maxCanvasY, boundingBox.bottom);
    });
    const { x: minDOMX, y: minDOMY } = this.graph.canvasToDOM({
      x: minCanvasX,
      y: minCanvasY,
    });
    const { x: maxDOMX, y: maxDOMY } = this.graph.canvasToDOM({
      x: maxCanvasX,
      y: maxCanvasY,
    });

    this.graph.setSize(maxDOMX - minDOMX + "px", maxDOMY - minDOMY);

    // Reset zoom (which is adjusted when the size is set).
    this.graph.moveTo({ scale: 1, position: { x: 0, y: 0 } });
  }

  afterDrawingOnce(f) {
    this.graph.once("afterDrawing", f);
  }

  unselectAll() {
    this.graph.unselectAll();
  }

  selectNodes(nodeIds) {
    this.graph.selectNodes(nodeIds);
  }
}
