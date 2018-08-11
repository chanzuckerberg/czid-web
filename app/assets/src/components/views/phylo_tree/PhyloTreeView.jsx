import React from "react";
import PhyloTreeViz from "./PhyloTreeViz";
import PhyloTreeInputs from "./PhyloTreeInputs";

class PhyloTreeView extends React.Component {
  constructor(props) {
    super();
    this.csrf = props.csrf;
    this.project = props.project;
    this.samples = props.samples;
    this.can_edit = props.can_edit;
    this.phylo_tree = props.phylo_tree;
  }

  render() {
    return (
      <div>
        <PhyloTreeInputs
          disabled
          phylo_tree={this.phylo_tree}
          csrf={this.csrf}
          project={this.project}
          samples={this.samples}
        />
        <PhyloTreeViz
          csrf={this.csrf}
          can_edit={this.can_edit}
          phylo_tree={this.phylo_tree}
        />
      </div>
    );
  }
}

export default PhyloTreeView;
