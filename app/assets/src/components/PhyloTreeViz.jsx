import axios from "axios";
import React from "react";

class PhyloTreeViz extends React.Component {
  constructor(props) {
    super();
    this.phylo_tree = props.phylo_tree;
  }

  render() {
    return this.phylo_tree ? <div>a tree here</div> : null;
  }
}

export default PhyloTreeViz;
