import axios from "axios";
import React from "react";
import { Button, Checkbox, Input } from "semantic-ui-react";
import PhyloTreeViz from "./PhyloTreeViz";

class PhyloTree extends React.Component {
  constructor(props) {
    super();
    this.csrf = props.csrf;
    this.project = props.project;
    this.samples = props.samples;
    this.can_edit = props.can_edit;
    this.phylo_tree = props.phylo_tree;
    this.selectedPipelineRunIds = this.phylo_tree.pipeline_runs.map(
      pr => pr.id
    );
  }

  render() {
    let title = (
      <h2>
        Phylogenetic tree for <i>{this.phylo_tree.tax_name}</i> in project{" "}
        <i>{this.project.name}</i>
      </h2>
    );
    let sample_list = this.samples.map(function(s, i) {
      return (
        <div>
          <input
            type="checkbox"
            id={s.pipeline_run_id}
            key={s.pipeline_run_id}
            data-pipeline-run-id={s.pipeline_run_id}
            checked={
              this.selectedPipelineRunIds.indexOf(s.pipeline_run_id) >= 0
            }
            disabled
          />
          <label htmlFor={s.pipeline_run_id}>
            {s.name} ({s.taxid_nt_reads} reads)
          </label>
        </div>
      );
    }, this);
    let tree_name = <Input id="treeName" placeholder="Name" disabled />;
    return (
      <div>
        {title}
        <h3>Relevant samples:</h3>
        {tree_name}
        {sample_list}
        <PhyloTreeViz
          csrf={this.csrf}
          can_edit={this.can_edit}
          phylo_tree={this.phylo_tree}
        />
      </div>
    );
  }
}

export default PhyloTree;
