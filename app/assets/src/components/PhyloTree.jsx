import axios from "axios";
import React from "react";

class PhyloTree extends React.Component {
  constructor(props) {
    super();
    this.project = props.project;
    this.samples = props.samples;
    this.pipeline_runs = props.pipeline_runs;
    this.tree = props.tree;
    this.state = {
      status: ''
    };
  }

  render() {
    let no_tree_yet = (this.tree === undefined || this.tree.length == 0);
    let sample_list = this.samples.map(function(s, i) { return <p>{s.name}</p> });
    return (
      <div>
        <p>Samples:</p>
        {sample_list}
        { no_tree_yet ? "Tree has not been generated yet" : "Tree exists" }
      </div>
    );
  }
}

export default PhyloTree;
