import PropTypes from "prop-types";
import React from "react";
import Input from "../../ui/controls/Input";
import Wizard from "../../ui/containers/Wizard";
import axios from "axios";
import DataTable from "../../visualizations/table/DataTable";
import Moment from "react-moment";

const MinNumberOfSamples = 4;
class PhyloTreeByPathCreation extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      defaultPage: 0,
      skipListTrees: false,
      phyloTreesLoaded: false,
      phyloTrees: [],

      samplesLoaded: false,
      projectSamples: [],
      selectedProjectSamples: new Set(),

      otherSamples: [],
      selectedOtherSamples: new Set(),
      otherSamplesFilter: "",

      showErrors: false,
      treeName: ""
    };

    this.phyloTreeHeaders = {
      name: "Phylogenetic Tree",
      user: "Creator",
      last_update: "Last Updated",
      view: "View"
    };

    this.projectSamplesHeaders = {
      name: "Name",
      host: "Host",
      tissue: "Tissue",
      location: "Location",
      date: "Date",
      reads: "Read Count"
    };

    this.otherSamplesHeaders = {
      name: "Name",
      project: "Project",
      host: "Host",
      tissue: "Tissue",
      location: "Location",
      date: "Date",
      reads: "Read Count\n(NT | NR)"
    };

    this.taxonName = null;
    this.dagBranch = "";

    this.inputTimeout = null;
    this.inputDelay = 500;

    this.canContinue = this.canContinue.bind(this);
    this.handleBranchChange = this.handleBranchChange.bind(this);
    this.handleChangedProjectSamples = this.handleChangedProjectSamples.bind(
      this
    );
    this.handleChangedOtherSamples = this.handleChangedOtherSamples.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleNewTreeContextResponse = this.handleNewTreeContextResponse.bind(
      this
    );
    this.isTreeNameValid = this.isTreeNameValid.bind(this);
    this.loadNewTreeContext = this.loadNewTreeContext.bind(this);
  }

  componentDidMount() {
    this.loadPhylotrees();
  }

  loadPhylotrees() {
    axios
      .get("/phylo_trees/index.json", {
        params: {
          taxId: this.props.taxonId,
          projectId: this.props.projectId
        }
      })
      .then(response => this.handlePhyloTreeResponse(response))
      .catch(error => {
        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Error loading existing phylo trees: ", error);
      });
  }

  loadNewTreeContext() {
    axios
      .get("/phylo_trees/new.json", {
        params: {
          taxId: this.props.taxonId,
          projectId: this.props.projectId
        }
      })
      .then(response => this.handleNewTreeContextResponse(response))
      .catch(error => {
        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Error loading new phylo tree context: ", error);
      });
  }

  handlePhyloTreeResponse(response) {
    let phyloTrees = response.data.phyloTrees;
    if (!phyloTrees || !Array.isArray(phyloTrees) || phyloTrees.length === 0) {
      this.setState({
        skipListTrees: true,
        phyloTreesLoaded: true
      });
    } else {
      this.taxonName = phyloTrees[0].tax_name;
      this.setState({
        phyloTrees: this.parsePhyloTreeData(response.data.phyloTrees),
        phyloTreesLoaded: true
      });
    }
  }

  handleNewTreeContextResponse(response) {
    let samplesData = response.data.samples;
    if (
      !samplesData ||
      !Array.isArray(samplesData) ||
      samplesData.length === 0
    ) {
      // TODO: properly handle error
      // eslint-disable-next-line no-console
      console.error("Error loading samples data");
    } else {
      let parsedTables = this.parseProjectSamplesData(samplesData);
      this.setState({
        projectSamples: parsedTables.projectSamples,
        otherSamples: parsedTables.otherSamples,
        samplesLoaded: true
      });
    }
  }

  parsePhyloTreeData(phyloTreeData) {
    return phyloTreeData.map(row => ({
      name: row.name,
      user: row.user.name,
      last_update: <Moment fromNow date={row.updated_at} />,
      view: <a href={`/phylo_trees/index?treeId=${row.id}`}>View</a>
    }));
  }

  parseProjectSamplesData(samples) {
    let projectSamples = [];
    let otherSamples = [];
    for (let i = 0; i < samples.length; i++) {
      const row = samples[i];
      let entry = {
        name: row.name,
        host: "-",
        tissue: "-",
        location: "-",
        date: "-",
        reads: `${(row.taxid_reads || {}).NT} | ${(row.taxid_reads || {}).NR}`
      };
      if (row.project_id === this.props.projectId) {
        projectSamples.push(entry);
      } else {
        entry.project = row.project_name;
        otherSamples.push(entry);
      }
    }
    return { projectSamples, otherSamples };
  }

  setPage(defaultPage) {
    this.setState({ defaultPage });
  }

  handleChangedProjectSamples(selectedProjectSamples) {
    this.setState({ selectedProjectSamples });
  }

  handleChangedOtherSamples(selectedOtherSamples) {
    this.setState({ selectedOtherSamples });
  }

  handleFilterChange(_, input) {
    clearTimeout(this.inputTimeout);
    this.inputTimeout = setTimeout(() => {
      this.setState({ otherSamplesFilter: input.value });
    }, this.inputDelay);
  }

  handleNameChange(_, input) {
    this.setState({ treeName: input.value.trim() });
  }

  handleBranchChange(_, input) {
    this.dagBranch = input.value.trim();
  }

  handleCreation() {
    let errors = [];

    let totalSelectedSamples =
      this.state.selectedProjectSamples + this.state.selectedOtherSamples;
    if (totalSelectedSamples < MinNumberOfSamples) {
      errors.push(`Please select at least ${MinNumberOfSamples} samples.`);
    }

    if (this.state.treeName.length == 0) {
      errors.push("Please choose a name for the tree.");
    }

    if (errors.length == 0) {
      let pipelineRunIds = [];
      this.state.selectedProjectSamples.forEach(rowIndex => {
        this.projectSamples[rowIndex].pipeline_run_id;
      });

      axios
        .post("/phylo_trees/create", {
          name: this.newTreeName,
          dag_branch: this.dagBranch,
          project_id: this.props.projectId,
          taxid: this.props.taxonId,
          tax_name: this.taxonName,
          pipeline_run_ids: pipelineRunIds,
          authenticity_token: this.props.csrf
        })
        .then(response => {
          let phyloTreeId = response.data.phylo_tree_id;
          if (phyloTreeId) {
            location.href = `/phylo_trees/index?treeId=${phyloTreeId}`;
          } else {
            // TODO: properly handle error
            // eslint-disable-next-line no-console
            console.error("Error creating tree");
          }
        });
    }

    return errors;
  }

  handleComplete() {
    // check if there are enough samples
    this.handleCreation();

    if (this.props.onComplete) {
      this.props.onComplete();
    }
  }

  isTreeNameValid() {
    return this.state.treeName.length > 0;
  }

  canContinue() {
    if (this.isTreeNameValid()) {
      return true;
    }
    this.setState({ showErrors: true });
    return false;
  }

  getPages() {
    let pages = [];
    if (!this.state.skipListTrees) {
      pages.push(
        <Wizard.Page
          key="page_1"
          className="wizard__page-1"
          skipDefaultButtons={true}
          title="Phylogenetic Trees"
          small
        >
          <div className="wizard__page-1__subtitle">{this.taxonName}</div>
          <div className="wizard__page-1__table">
            {this.state.phyloTreesLoaded && (
              <DataTable
                headers={this.phyloTreeHeaders}
                columns={["name", "user", "last_update", "view"]}
                data={this.state.phyloTrees}
              />
            )}
          </div>
          <div className="wizard__page-1__action">
            <Wizard.Action action="continue">+ Create new tree</Wizard.Action>
          </div>
        </Wizard.Page>
      );
    }
    pages.push(
      <Wizard.Page
        key="wizard__page_2"
        title="Create phylogenetic tree and select samples from project"
        onLoad={this.loadNewTreeContext}
        onContinue={this.canContinue}
      >
        <div className="wizard__page-2__subtitle">{this.taxonName}</div>
        <div className="wizard__page-2__form">
          <div>
            <div className="wizard__page-2__form__label-name">Name</div>
            <Input
              className={
                this.state.showErrors && !this.isTreeNameValid() ? "error" : ""
              }
              placeholder="Tree Name"
              onChange={this.handleNameChange}
            />
          </div>
          {this.props.admin === 1 && (
            <div>
              <div className="wizard__page-2__form__label-branch">Branch</div>
              <Input placeholder="master" onChange={this.handleBranchChange} />
            </div>
          )}
        </div>
        <div className="wizard__page-2__table">
          {this.state.samplesLoaded && (
            <DataTable
              headers={this.projectSamplesHeaders}
              columns={["name", "host", "tissue", "location", "date", "reads"]}
              data={this.state.projectSamples}
              selectedRows={this.state.selectedProjectSamples}
              onSelectedRowsChanged={this.handleChangedProjectSamples}
            />
          )}
        </div>
      </Wizard.Page>,
      <Wizard.Page
        key="wizard__page_3"
        title={`Would you like to additional samples from IDSeq that contain ${
          this.taxonName
        }`}
      >
        <div className="wizard__page-3__subtitle" />
        <div className="wizard__page-3__searchbar">
          <div className="wizard__page-3__searchbar__container">
            <Input placeholder="Search" onChange={this.handleFilterChange} />
          </div>
          <div className="wizard__page-3__searchbar__container">
            {this.state.selectedProjectSamples.size} Project Samples
          </div>
          <div className="wizard__page-3__searchbar__container">
            {this.state.selectedOtherSamples.size} IDSeq Samples
          </div>
          <div className="wizard__page-3__searchbar__container">
            {this.state.selectedProjectSamples.size +
              this.state.selectedOtherSamples.size}{" "}
            Total Samples
          </div>
        </div>
        <div className="wizard__page-3__table">
          {this.state.samplesLoaded && (
            <DataTable
              headers={this.otherSamplesHeaders}
              columns={[
                "name",
                "project",
                "host",
                "tissue",
                "location",
                "date",
                "reads"
              ]}
              data={this.state.otherSamples}
              selectedRows={this.state.selectedOtherSamples}
              onSelectedRowsChanged={this.handleChangedOtherSamples}
              filter={this.state.otherSamplesFilter}
            />
          )}
        </div>
      </Wizard.Page>
    );
    return pages;
  }

  render() {
    if (this.state.phyloTreesLoaded) {
      return (
        <Wizard
          skipPageInfoNPages={this.state.skipListTrees ? 0 : 1}
          onComplete={this.handleComplete}
          defaultPage={this.state.defaultPage}
          labels={{
            finish: "Create Tree"
          }}
        >
          {this.getPages()}
        </Wizard>
      );
    } else {
      return <div>Loading Phylo Trees...</div>;
    }
  }
}

PhyloTreeByPathCreation.propTypes = {
  admin: PropTypes.number,
  csrf: PropTypes.string.isRequired,
  onComplete: PropTypes.func,
  projectId: PropTypes.number,
  taxonId: PropTypes.number
};

export default PhyloTreeByPathCreation;
