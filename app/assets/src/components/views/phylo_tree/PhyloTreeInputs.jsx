import axios from "axios";
import React from "react";
import { Input, Accordion, Menu } from "semantic-ui-react";
import PrimaryButton from "../../ui/controls/buttons/PrimaryButton";

const MIN_READS = 100;

class PhyloTreeInputs extends React.Component {
  // PhyloTreeInputs represents the inputs for the phylo_tree
  constructor(props) {
    super();
    this.disabled = props.disabled;
    this.phyloTree = props.phyloTree;
    this.csrf = props.csrf;
    this.admin = props.admin;
    this.taxon = this.phyloTree
      ? {
          name: this.phyloTree.tax_name,
          taxid: this.phyloTree.taxid
        }
      : props.taxon;
    this.project = props.project;
    this.samples = props.samples;
    this.state = {
      activeProjects: [],
      selectedPipelineRunIds:
        this.disabled && this.phyloTree
          ? // if a tree is present, default to its pipeline runs:
            this.phyloTree.pipeline_runs.map(pr => pr.id)
          : // if no tree is present, default to those boxes that have enough reads and belong to the project
            this.samples
              .filter(
                s =>
                  PhyloTreeInputs.passesCreateCondition(s.taxid_reads) &&
                  s.project_id == this.project.id
              )
              .map(s => s.pipeline_run_id)
    };

    this.createTree = this.createTree.bind(this);
    this.handleInputChange = this.handleInputChange.bind(this);
    this.renderTextInput = this.renderTextInput.bind(this);
    this.renderSampleCheckbox = this.renderSampleCheckbox.bind(this);
    this.handleProjectClick = this.handleProjectClick.bind(this);
    this.updatePipelineRunIdSelection = this.updatePipelineRunIdSelection.bind(
      this
    );
  }

  static passesCreateCondition(taxid_reads) {
    let result = Math.max(taxid_reads.NT, taxid_reads.NR) >= MIN_READS;
    return result;
  }

  handleProjectClick(project_name) {
    let activeProjects = this.state.activeProjects;
    let index = this.state.activeProjects.indexOf(project_name);
    if (index < 0) {
      activeProjects.push(project_name);
    } else {
      activeProjects.splice(index, 1);
    }
    this.setState({ activeProjects: activeProjects });
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

  renderTextInput(id, placeholder, valueFieldIfPresent) {
    return (
      <Input
        id={id}
        placeholder={placeholder}
        disabled={this.disabled}
        value={
          this.disabled && this.phyloTree
            ? this.phyloTree[valueFieldIfPresent]
            : undefined
        }
        onChange={this.handleInputChange}
      />
    );
  }

  renderSampleCheckbox(sample) {
    return (
      <div>
        <input
          type="checkbox"
          id={sample.pipeline_run_id}
          key={sample.pipeline_run_id}
          onChange={e =>
            this.updatePipelineRunIdSelection(e, sample.pipeline_run_id)
          }
          checked={
            this.state.selectedPipelineRunIds.indexOf(sample.pipeline_run_id) >=
            0
          }
          disabled={
            this.disabled ||
            !PhyloTreeInputs.passesCreateCondition(sample.taxid_reads)
          }
        />
        <label htmlFor={sample.pipeline_run_id}>
          {sample.name} ({sample.taxid_reads.NT} NT hits;{" "}
          {sample.taxid_reads.NR} NR hits)
        </label>
      </div>
    );
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
          dag_branch: this.state.dagBranch,
          project_id: this.project.id,
          taxid: this.taxon.taxid,
          pipeline_run_ids: pipeline_run_ids,
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

    // Generate sample list within the current project
    let samples_in_project = this.samples.filter(
      s => s.project_id == this.project.id
    );
    let sample_display_in_project = (
      <div>
        <br />
        <b>Samples from this project:</b>
        <br />
        {samples_in_project.length === 0
          ? "None."
          : samples_in_project.map(this.renderSampleCheckbox, this)}
      </div>
    );

    // Generate list of samples from other projects, organized by project
    let samples_by_project_name = {};
    for (let sample of this.samples) {
      if (sample.project_id != this.project.id) {
        samples_by_project_name[sample.project_name] = (
          samples_by_project_name[sample.project_name] || []
        ).concat([sample]);
      }
    }
    let project_names = Object.keys(samples_by_project_name);

    let sample_display_outside_project =
      project_names.length === 0 ? null : (
        <div>
          <br />
          <b>
            {this.disabled
              ? "Samples from other projects:"
              : `You may wish to include samples from other projects that contain ${
                  this.taxon.name
                }:`}
          </b>
          <Accordion as={Menu} vertical size="massive" exclusive={false}>
            {Object.keys(samples_by_project_name).map(project_name => {
              return (
                <Menu.Item>
                  <Accordion.Title
                    content={project_name}
                    onClick={() => this.handleProjectClick(project_name)}
                  />
                  <Accordion.Content
                    active={
                      this.disabled ||
                      this.state.activeProjects.indexOf(project_name) >= 0
                    }
                    content={samples_by_project_name[project_name].map(
                      this.renderSampleCheckbox,
                      this
                    )}
                  />
                </Menu.Item>
              );
            })}
          </Accordion>
        </div>
      );

    let tree_name = this.renderTextInput("treeName", "Name", "name");
    let dagBranchInput =
      this.admin != 1
        ? null
        : this.renderTextInput("dagBranch", "DAG branch", "dag_branch");

    let create_button = this.disabled ? null : (
      <div>
        <PrimaryButton text="Create Tree" onClick={this.createTree} />
        <p>{this.state.status_message}</p>
      </div>
    );

    return (
      <div>
        {title}
        {tree_name}
        {dagBranchInput}
        {sample_display_in_project}
        {create_button}
        {sample_display_outside_project}
      </div>
    );
  }
}
export default PhyloTreeInputs;
