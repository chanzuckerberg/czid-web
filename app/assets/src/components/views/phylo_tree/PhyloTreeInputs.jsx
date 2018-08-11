import axios from "axios";
import React from "react";
import { Input, Checkbox, Button } from "semantic-ui-react";

class PhyloTreeInputs extends React.Component {
  constructor(props) {
    super();
    this.disabled = props.disabled;
    this.phyloTree = props.phyloTree;
    this.csrf = props.csrf;
    this.taxon = this.phyloTree
      ? {
          name: this.phyloTree.tax_name,
          tax_level: this.phyloTree.tax_level,
          taxid: this.phyloTree.taxid
        }
      : props.taxon;
    this.project = props.project;
    this.samples = props.samples;
    this.MinReads = 5;
    this.state = {
      selectedPipelineRunIds:
        this.disabled && this.phyloTree
          ? this.phyloTree.pipeline_runs.map(pr => pr.id)
          : this.samples
              .filter(s => s.taxid_nt_reads >= this.MinReads)
              .map(s => s.pipeline_run_id)
    };

    this.createTree = this.createTree.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.updatePipelineRunIdSelection = this.updatePipelineRunIdSelection.bind(
      this
    );
  }

  updatePipelineRunIdSelection(e, PrId) {
    let PrIdList = this.state.selectedPipelineRunIds;
    let index = PrIdList.indexOf(+PrId);
    if (e.target.checked) {
      if (index < 0) {
        PrIdList.push(+PrId);
      }
    } else {
      if (index >= 0) {
        PrIdList.splice(index, 1);
      }
    }
    this.setState({ selectedPipelineRunIds: PrIdList });
  }

  handleInputChange(e, { name, value }) {
    this.setState({ [e.target.id]: value });
  }

  createTree() {
    let pipeline_run_ids = this.state.selectedPipelineRunIds;
    if (pipeline_run_ids.length < 4) {
      this.setState({
        status_message: "ERROR: Need at least 4 samples to construct a tree"
      });
    } else {
      var that = this;
      axios
        .post("/phylo_trees/create", {
          name: this.state.treeName,
          project_id: this.project.id,
          taxid: this.taxon.taxid,
          pipeline_run_ids: pipeline_run_ids,
          tax_level: this.taxon.tax_level,
          tax_name: this.taxon.name,
          authenticity_token: this.csrf
        })
        .then(res => {
          let message = res.data.message;
          that.setState(
            {
              show_create_button: !(res.data.status === "ok"),
              status_message:
                message instanceof Array ? message.join("; ") : message
            },
            () => {
              if (res.data.phylo_tree_id) {
                location.href = `/phylo_trees/show?id=${
                  res.data.phylo_tree_id
                }`;
              }
            }
          );
        });
    }
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
        <div>
          <input
            type="checkbox"
            id={s.pipeline_run_id}
            key={s.pipeline_run_id}
            onChange={e =>
              this.updatePipelineRunIdSelection(e, s.pipeline_run_id)
            }
            checked={
              this.state.selectedPipelineRunIds.indexOf(s.pipeline_run_id) >= 0
            }
            disabled={this.disabled || s.taxid_nt_reads < this.MinReads}
          />
          <label htmlFor={s.pipeline_run_id}>
            {s.name} ({s.taxid_nt_reads} reads)
          </label>
        </div>
      );
    }, this);

    let tree_name = (
      <Input
        id="treeName"
        placeholder="Name"
        disabled={this.disabled}
        value={this.disabled ? this.phyloTree.name : undefined}
        onChange={this.handleInputChange}
      />
    );

    let create_button = this.disabled ? null : (
      <div>
        <Button primary onClick={this.createTree}>
          Create Tree
        </Button>
        <p>{this.state.status_message}</p>
      </div>
    );

    return (
      <div>
        {title}
        {tree_name}
        {sample_list}
        {create_button}
      </div>
    );
  }
}
export default PhyloTreeInputs;
