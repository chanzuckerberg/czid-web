import axios from "axios";
import React from "react";

class PhyloTreeViz extends React.Component {
  constructor(props) {
    super();
    this.phylo_tree = props.phylo_tree;
  }

  render() {
    let status_display, newick;
    if (this.phylo_tree) {
      switch (this.phylo_tree.status) {
        case 1:
          status_display = "TREE IS READY";
          break;
        case 2:
          status_display = "TREE GENERATION FAILED";
          break;
        default:
          status_display = "TREE GENERATION IN PROGRESS";
      }
      newick = this.phylo_tree.newick;
    }
    return (
      <div>
        <p>{status_display}</p>
        <p>{newick}</p>
      </div>
    );
  }
}

export default PhyloTreeViz;
