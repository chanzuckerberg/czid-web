import { DataSet, Network } from "visjs-network";

export default class NetworkGraph {
  constructor(container, nodeData, edgeData, options) {
    const { onClick, ...networkOptions } = options;
    this.data = {
      nodes: new DataSet(nodeData),
      edges: new DataSet(edgeData),
    };
    this.graph = new Network(container, this.data, networkOptions);
    this.graph.on("click", onClick);
  }

  moveNodeToPosition(nodeId, xDOMCoord, yDOMCoord) {
    const canvasCoords = this.graph.DOMtoCanvas({ x: xDOMCoord, y: yDOMCoord });
    this.graph.moveNode(nodeId, canvasCoords.x, canvasCoords.y);
  }

  getNodePosition(nodeId) {
    const canvasCoords = this.graph.getPositions([nodeId])[nodeId];
    return this.graph.canvasToDOM(canvasCoords);
  }

  minimizeWidthGivenScale(scale) {
    // Set initial zoom for width calculation.
    this.graph.moveTo({ scale: scale });

    // Compute minimum and maximum x coordinates of nodes.
    let minCanvasX = Number.MAX_VALUE;
    let maxCanvasX = Number.MIN_VALUE;
    this.data.nodes.getIds().forEach(nodeId => {
      const boundingBox = this.graph.getBoundingBox(nodeId);
      minCanvasX = Math.min(minCanvasX, boundingBox.right);
      maxCanvasX = Math.max(maxCanvasX, boundingBox.left);
    });
    const minDOMX = this.graph.canvasToDOM({ x: minCanvasX }).x;
    const maxDOMX = this.graph.canvasToDOM({ x: maxCanvasX }).x;

    this.graph.setSize(maxDOMX - minDOMX + "px", "100%");

    // Reset zoom (which is adjust when the size is set).
    this.graph.moveTo({ scale: 1, position: { x: 0, y: 0 } });
  }

  afterDrawingOnce(f) {
    this.graph.once("afterDrawing", f);
  }
}
