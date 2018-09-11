import React from "react";
import PhyloTreeViz from "./PhyloTreeViz";
import PhyloTreeInputs from "./PhyloTreeInputs";

class PhyloTreeView extends React.Component {
  constructor(props) {
    super();
    this.csrf = props.csrf;
    this.admin = props.admin;
    this.project = props.project;
    this.samples = props.samples;
    this.canEdit = props.canEdit;
    this.phyloTree = props.phyloTree;
  }

  render() {
    return (
      <div>
        <PhyloTreeInputs
          disabled
          phyloTree={this.phyloTree}
          csrf={this.csrf}
          admin={this.admin}
          project={this.project}
          samples={this.samples}
        />
        <PhyloTreeViz
          csrf={this.csrf}
          canEdit={this.canEdit}
          phyloTree={this.phyloTree}
        />
      </div>
    );
  }
}

export default PhyloTreeView;
