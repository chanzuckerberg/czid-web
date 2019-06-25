import { DataSet } from "visjs-network";

export default class NetworkGraph {
  constructor(container, nodeData, edgeData, options) {
    this.data = {
      nodes: new DataSet(nodeData),
      edges: new DataSet(edgeData),
    };
  }
}
