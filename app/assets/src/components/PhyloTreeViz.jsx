import axios from "axios";
import React from "react";

class PhyloTreeViz extends React.Component {
  constructor(props) {
    super();
    this.phylo_tree = props.phylo_tree;
  }

  render() {
    return (
      (this.phylo_tree === undefined || this.phylo_tree.length == 0) ? null
        : (
          <div>a tree here</div>
        )
    );
  }
}

export default PhyloTreeViz;
