import axios from "axios";
import React from "react";
import { Button, Input, Checkbox } from "semantic-ui-react";

class NewPhyloTree extends React.Component {
  constructor(props) {
    super();
    this.csrf = props.csrf;
    this.taxon = props.taxon;
    this.project = props.project;
    this.samples = props.samples;
    this.MIN_READS = 5;
    this.state = {
      selectedPipelineRunIds: this.samples
        .filter(s => s.taxid_nt_reads >= this.MIN_READS)
        .map(s => s.pipeline_run_id)
    };

    this.createTree = this.createTree.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.updatePipelineRunIdSelection = this.updatePipelineRunIdSelection.bind(
      this
    );
  }

  updatePipelineRunIdSelection(e) {
    let PrId = e.target.getAttribute("data-pipeline-run-id");
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
          that.setState({
            show_create_button: !(res.data.status === "ok"),
            status_message: res.data.message
          });
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
            data-pipeline-run-id={s.pipeline_run_id}
            onClick={this.updatePipelineRunIdSelection}
            checked={
              this.state.selectedPipelineRunIds.indexOf(s.pipeline_run_id) >= 0
            }
            disabled={s.taxid_nt_reads < this.MIN_READS}
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
        onChange={this.handleInputChange}
      />
    );
    return (
      <div>
        {title}
        <h3>Relevant samples:</h3>
        {tree_name}
        {sample_list}
        <Button primary onClick={this.createTree}>
          Create Tree
        </Button>
        <p>{this.state.status_message}</p>
      </div>
    );
  }
}

export default NewPhyloTree;
