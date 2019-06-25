import { DataSet, Network } from "vis";

export default class NetworkGraph {
  constructor(container, nodeData, edgeData, options) {
    this.data = {
      nodes: new DataSet(nodeData),
      edges: new DataSet(edgeData),
    };
    this.graph = new Network(container, this.data, options);
  }
}
