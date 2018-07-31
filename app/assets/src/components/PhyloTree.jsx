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
      status: null
    };

    this.createTree = this.createTree.bind(this);
  }

  createTree() {
    let pipeline_run_ids = this.pipeline_runs.map(pr => pr.id);
    var that = this;
    axios
      .post(
        `/trees/create?project_id=${this.project.id}&taxid=${
          this.taxon.taxid
        }&tax_level=${
          this.taxon.tax_level
        }&pipeline_run_ids=${pipeline_run_ids}`,
        {
          authenticity_token: this.csrf
        }
      )
      .then(res => {
        that.setState({
          status: res.data.status,
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
      return <p>{s.name}</p>;
    });
    let create_button = (
      <div>
        {this.state.status === "ok" ? null : (
          <Button primary onClick={this.createTree}>
            Create Tree
          </Button>
        )}
        <p>{this.state.status_message}</p>
      </div>
    );
    return (
      <div>
        {title}
        <h3>Relevant samples:</h3>
        {sample_list}
        {this.phylo_tree ? (
          <PhyloTreeViz phylo_tree={this.phylo_tree} />
        ) : (
          create_button
        )}
      </div>
    );
  }
}

export default PhyloTree;
