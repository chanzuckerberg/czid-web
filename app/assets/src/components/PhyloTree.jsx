import axios from "axios";
import React from "react";
import { Button } from "semantic-ui-react";
import PhyloTreeViz from "./PhyloTreeViz";

class PhyloTree extends React.Component {
  constructor(props) {
    super();
    this.csrf = props.csrf;
    this.taxon = props.taxon;
    this.project = props.project;
    this.samples = props.samples;
    this.pipeline_runs = props.pipeline_runs;
    this.phylo_tree = props.phylo_tree;
    this.state = {
      show_create_button:
        !this.phylo_tree || (this.phylo_tree && this.phylo_tree.status == 2)
    };

    this.createTree = this.createTree.bind(this);
  }

  createTree() {
    let pipeline_run_ids = this.pipeline_runs.map(pr => pr.id);
    var that = this;
    axios
      .post(
        `/phylo_trees/create?project_id=${this.project.id}&taxid=${
          this.taxon.taxid
        }&pipeline_run_ids=${pipeline_run_ids}`,
        {
          tax_level: this.taxon.tax_level,
          tax_name: this.taxon.name,
          authenticity_token: this.csrf
        }
      )
      .then(res => {
        that.setState({
          show_create_button: !(res.data.status === "ok"),
          status_message: res.data.message
        });
      });
  }

  render() {
    let title = (
      <h2>
        Phylogenetic tree for <i>{this.taxon.name}</i> in project{" "}
        <i>{this.project.name}</i>
      </h2>
    );
    let sample_list = this.samples.map(function(s, i) {
      return (
        <p>
          {s.name} ({s.taxid_nt_reads} reads)
        </p>
      );
    }, this);
    return (
      <div>
        {title}
        <h3>Relevant samples:</h3>
        {sample_list}
        {this.phylo_tree ? <PhyloTreeViz phylo_tree={this.phylo_tree} /> : null}
        {this.state.show_create_button ? (
          <Button primary onClick={this.createTree}>
            Create Tree
          </Button>
        ) : null}
        <p>{this.state.status_message}</p>
      </div>
    );
  }
}

export default PhyloTree;
