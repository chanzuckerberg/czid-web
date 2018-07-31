import axios from "axios";
import d3 from "d3";
import phylotree from "phylotree";
import React from "react";

class PhyloTreeViz extends React.Component {
  constructor(props) {
    super();
    this.phylo_tree = props.phylo_tree;
    this.createTreeViz = this.createTreeViz.bind(this);
  }

  componentDidMount() {
    this.createTreeViz();
  }
  componentDidUpdate() {
    this.createTreeViz();
  }
  createTreeViz() {
    if (this.phylo_tree && this.phylo_tree.newick) {
      let newick = this.phylo_tree.newick;
      // below from http://bl.ocks.org/spond/f6b51aa6f34561f7006f
      let _ = require("lodash");
      let tree = d3.layout
        .phylotree()
        // create a tree layout object
        .svg(d3.select(this.node));
      // render to this SVG element
      tree(d3.layout.newick_parser(newick))
        // parse the Newick into a d3 hierarchy object with additional fields
        .layout();
      // layout and render the tree
    }
  }

  render() {
    let status_display, newick, tree;
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
    }
    return (
      <div>
        <p>{status_display}</p>
        <svg ref={node => (this.node = node)} />
      </div>
    );
  }
}

export default PhyloTreeViz;
