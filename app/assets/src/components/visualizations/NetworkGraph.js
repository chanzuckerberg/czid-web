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

  getEdgesBetweenNodes(fromNodeId, toNodeId) {
    if (fromNodeId != null && toNodeId != null) {
      return this.data.edges.getIds({
        filter: edge => edge.from == fromNodeId && edge.to == toNodeId,
      });
    } else if (fromNodeId != null) {
      return this.getConnectedEdges(fromNodeId, "from");
    } else if (toNodeId != null) {
      return this.getConnectedEdges(toNodeId, "to");
    } else {
      return this.data.edges.getIds();
    }
  }

  getConnectedEdges(nodeId, direction) {
    let filterFunc;
    switch (direction) {
      case "to":
        filterFunc = edge => edge.to == nodeId;
        break;
      case "from":
        filterFunc = edge => edge.from == nodeId;
        break;
      default:
        filterFunc = edge => edge.to == nodeId || edge.from == nodeId;
    }

    return this.data.edges.getIds({
      filter: filterFunc,
    });
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

  minimizeWidthGivenScale(scale) {
    // Set initial zoom for width calculation.
    this.graph.moveTo({ scale: scale });

    // Compute minimum and maximum x coordinates of nodes.
    let minCanvasX = Number.MAX_VALUE;
    let maxCanvasX = Number.MIN_VALUE;
    this.data.nodes.getIds().forEach(nodeId => {
      const boundingBox = this.graph.getBoundingBox(nodeId);
      minCanvasX = Math.min(minCanvasX, boundingBox.left);
      maxCanvasX = Math.max(maxCanvasX, boundingBox.right);
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

  unselectAll() {
    this.graph.unselectAll();
  }

  selectNodes(nodeIds) {
    this.graph.selectNodes(nodeIds);
  }
}
