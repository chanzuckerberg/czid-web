import axios from "axios";
import React from "react";

class PhyloTreeViz extends React.Component {
  constructor(props) {
    super();
    this.tree = props.tree;
  }

  render() {
    return (
      (this.tree === undefined || this.tree.length == 0) ? null
      : "tree would be here"
    );
  }
}

export default PhyloTreeViz;
