import PropTypes from "prop-types";
import React from "react";
import Input from "../../ui/controls/Input";
import Wizard from "../../ui/containers/Wizard";
import axios from "axios";
import DataTable from "../../visualizations/table/DataTable";
import Moment from "react-moment";
import PhyloTreeChecks from "./PhyloTreeChecks";

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

      showErrorName: false,
      showErrorSamples: false,
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
    this.handleComplete = this.handleComplete.bind(this);
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
    const data = response.data;
    let phyloTrees = data.phyloTrees;
    this.taxonName = (data.taxon || {}).name;
    if (!phyloTrees || !Array.isArray(phyloTrees) || phyloTrees.length === 0) {
      this.setState({
        skipListTrees: true,
        phyloTreesLoaded: true
      });
    } else {
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
      if (
        PhyloTreeChecks.passesCreateCondition(
          (row.taxid_reads || {}).NT,
          (row.taxid_reads || {}).NR
        )
      ) {
        let entry = {
          name: row.name,
          host: row.host,
          tissue: row.sample_tissue,
          location: row.sample_location,
          date: row.created_at,
          reads: `${(row.taxid_reads || {}).NT} | ${
            (row.taxid_reads || {}).NR
          }`,
          pipelineRunId: row.pipeline_run_id
        };
        if (row.project_id === this.props.projectId) {
          projectSamples.push(entry);
        } else {
          entry.project = row.project_name;
          otherSamples.push(entry);
        }
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
    if (!this.isNumberOfSamplesValid()) {
      this.setState({
        showErrorSamples: true
      });
      return false;
    }

    let pipelineRunIds = [];
    this.state.selectedProjectSamples.forEach(rowIndex => {
      pipelineRunIds.push(this.state.projectSamples[rowIndex].pipelineRunId);
    });
    this.state.selectedOtherSamples.forEach(rowIndex => {
      pipelineRunIds.push(this.state.otherSamples[rowIndex].pipelineRunId);
    });

    axios
      .post("/phylo_trees/create", {
        name: this.state.treeName,
        dagBranch: this.dagBranch,
        projectId: this.props.projectId,
        taxId: this.props.taxonId,
        taxName: this.taxonName,
        pipelineRunIds: pipelineRunIds,
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
      })
      .catch(error => {
        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Exception creating tree: ", error);
      });
    return true;
  }

  handleComplete() {
    if (this.handleCreation() && this.props.onComplete) {
      this.props.onComplete();
    }
  }

  isTreeNameValid() {
    return this.state.treeName.length > 0;
  }

  isNumberOfSamplesValid() {
    return (
      this.state.selectedProjectSamples.size +
        this.state.selectedOtherSamples.size >=
      MinNumberOfSamples
    );
  }

  canContinue() {
    if (this.isTreeNameValid()) {
      return true;
    }
    this.setState({ showErrorName: true });
    return false;
  }

  getTotalPageRendering() {
    let totalSelectedSamples =
      this.state.selectedProjectSamples.size +
      this.state.selectedOtherSamples.size;
    if (this.state.showErrorSamples && !this.isNumberOfSamplesValid()) {
      return (
        <span className="wizard__error">
          {totalSelectedSamples} Total Samples (min number is{" "}
          {MinNumberOfSamples})
        </span>
      );
    }
    return `${totalSelectedSamples} Total Samples`;
  }

  getPages() {
    let pages = [];
    const projectSamplesColumns = [
      "name",
      "host",
      "tissue",
      "location",
      "date",
      "reads"
    ];
    const otherSamplesColumns = [
      "name",
      "project",
      "host",
      "tissue",
      "location",
      "date",
      "reads"
    ];

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
        title="Create phylogenetic tree and select samples from the project"
        onLoad={this.loadNewTreeContext}
        onContinue={this.canContinue}
      >
        <div className="wizard__page-2__subtitle">{this.taxonName}</div>
        <div className="wizard__page-2__form">
          <div>
            <div className="wizard__page-2__form__label-name">Name</div>
            <Input
              className={
                this.state.showErrorName && !this.isTreeNameValid()
                  ? "error"
                  : ""
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
              columns={projectSamplesColumns}
              data={this.state.projectSamples}
              selectedRows={this.state.selectedProjectSamples}
              onSelectedRowsChanged={this.handleChangedProjectSamples}
            />
          )}
        </div>
      </Wizard.Page>,
      <Wizard.Page
        key="wizard__page_3"
        title={`Would you like additional samples from IDSeq that contain ${
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
            {this.getTotalPageRendering()}
          </div>
        </div>
        <div className="wizard__page-3__table">
          {this.state.samplesLoaded && (
            <DataTable
              headers={this.otherSamplesHeaders}
              columns={otherSamplesColumns}
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
