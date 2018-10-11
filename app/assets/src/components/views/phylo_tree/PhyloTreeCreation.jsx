import PropTypes from "prop-types";
import React from "react";
import Input from "../../ui/controls/Input";
import Wizard from "../../ui/containers/Wizard";
import axios from "axios";
import DataTable from "../../visualizations/table/DataTable";
import Moment from "react-moment";
import PhyloTreeChecks from "./PhyloTreeChecks";
import SearchBox from "../../ui/controls/SearchBox";
import LoadingIcon from "../../ui/icons/LoadingIcon";

class PhyloTreeCreation extends React.Component {
  constructor(props) {
    super(props);

    this.minNumberOfSamples = 4;
    this.maxNumberOfSamples = 100;

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

      taxaLoaded: false,
      taxonList: [],

      projectsLoaded: false,
      projectList: [],

      taxonId: this.props.taxonId,
      taxonName: this.props.taxonName,
      projectId: this.props.projectId,
      projectName: this.props.projectName,
      showErrorTaxonAndProject: false,

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
      reads: "Read Count\n(NT | NR)"
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

    this.skipSelectProjectAndTaxon = this.props.projectId && this.props.taxonId;

    this.dagBranch = "";

    this.inputTimeout = null;
    this.inputDelay = 500;

    this.canContinueWithTreeName = this.canContinueWithTreeName.bind(this);
    this.canContinueWithTaxonAndProject = this.canContinueWithTaxonAndProject.bind(
      this
    );
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
    this.handleTaxonSearchContextResponse = this.handleTaxonSearchContextResponse.bind(
      this
    );
    this.handleProjectSearchContextResponse = this.handleProjectSearchContextResponse.bind(
      this
    );
    this.handleSelectProject = this.handleSelectProject.bind(this);
    this.handleSelectTaxon = this.handleSelectTaxon.bind(this);
    this.isTreeNameValid = this.isTreeNameValid.bind(this);
    this.loadNewTreeContext = this.loadNewTreeContext.bind(this);
    this.loadProjectAndTaxonSearchContext = this.loadProjectAndTaxonSearchContext.bind(
      this
    );
  }

  componentDidMount() {
    this.loadPhylotrees();
  }

  loadPhylotrees() {
    axios
      .get("/phylo_trees/index.json", {
        params: {
          taxId: this.state.taxonId,
          projectId: this.state.projectId
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
          taxId: this.state.taxonId,
          projectId: this.state.projectId
        }
      })
      .then(response => this.handleNewTreeContextResponse(response))
      .catch(error => {
        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Error loading new phylo tree context: ", error);
      });
  }

  loadProjectAndTaxonSearchContext() {
    axios
      .get("/choose_project.json")
      .then(response => this.handleProjectSearchContextResponse(response))
      .catch(error => {
        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Error loading project search context: ", error);
      });

    axios
      .get("/choose_taxon.json")
      .then(response => this.handleTaxonSearchContextResponse(response))
      .catch(error => {
        // TODO: properly handle error
        // eslint-disable-next-line no-console
        console.error("Error loading taxon search context: ", error);
      });
  }

  handlePhyloTreeResponse(response) {
    const data = response.data;
    let phyloTrees = data.phyloTrees;
    if (!phyloTrees || !Array.isArray(phyloTrees) || phyloTrees.length === 0) {
      this.setState({
        skipListTrees: true,
        phyloTreesLoaded: true
      });
    } else {
      this.setState({
        phyloTrees: this.parsePhyloTreeData(response.data.phyloTrees),
        phyloTreesLoaded: true,
        taxonName: (data.taxon || {}).name
      });
    }
  }

  handleNewTreeContextResponse(response) {
    let samplesData = response.data.samples;
    if (!samplesData || !Array.isArray(samplesData)) {
      // TODO: properly handle error
      // eslint-disable-next-line no-console
      console.error("Error loading samples data");
    } else if (samplesData.length === 0) {
      this.setState({
        samplesLoaded: true
      });
    } else {
      let parsedTables = this.parseProjectSamplesData(samplesData);
      this.setState({
        projectSamples: parsedTables.projectSamples,
        otherSamples: parsedTables.otherSamples,
        samplesLoaded: true
      });
    }
  }

  handleProjectSearchContextResponse(response) {
    this.setState({
      projectList: response.data,
      projectsLoaded: true
    });
  }

  handleTaxonSearchContextResponse(response) {
    this.setState({
      taxonList: response.data,
      taxaLoaded: true
    });
  }

  handleSelectProject(e, { result }) {
    this.setState({
      projectId: result.project_id,
      projectName: result.title,
      // Reset sample lists (in case user went back and changed project selection after they had been loaded)
      samplesLoaded: false,
      projectSamples: [],
      selectedProjectSamples: new Set(),
      otherSamples: [],
      selectedOtherSamples: new Set(),
      otherSamplesFilter: ""
    });
  }

  handleSelectTaxon(e, { result }) {
    this.setState({
      taxonId: result.taxid,
      taxonName: result.title,
      // Reset sample lists (in case user went back and changed taxon selection after they had been loaded)
      samplesLoaded: false,
      projectSamples: [],
      selectedProjectSamples: new Set(),
      otherSamples: [],
      selectedOtherSamples: new Set(),
      otherSamplesFilter: ""
    });
  }

  parsePhyloTreeData(phyloTreeData) {
    return phyloTreeData.map(row => ({
      name: row.name,
      user: (row.user || {}).name,
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
          date: <Moment fromNow date={row.created_at} />,
          reads: `${(row.taxid_reads || {}).NT} | ${
            (row.taxid_reads || {}).NR
          }`,
          pipelineRunId: row.pipeline_run_id
        };
        if (row.project_id === this.state.projectId) {
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
        projectId: this.state.projectId,
        taxId: this.state.taxonId,
        taxName: this.state.taxonName,
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
    let nSamples =
      this.state.selectedProjectSamples.size +
      this.state.selectedOtherSamples.size;
    return (
      nSamples >= this.minNumberOfSamples && nSamples <= this.maxNumberOfSamples
    );
  }

  canContinueWithTaxonAndProject() {
    if (this.state.taxonId && this.state.projectId) {
      this.setState({ showErrorTaxonAndProject: false }); // remove any pre-existing error message
      return true;
    }
    this.setState({ showErrorTaxonAndProject: true });
    return false;
  }

  canContinueWithTreeName() {
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
          {totalSelectedSamples} Total Samples (must be between{" "}
          {this.minNumberOfSamples} and {this.maxNumberOfSamples})
        </span>
      );
    }
    return `${totalSelectedSamples} Total Samples`;
  }

  page(action) {
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
    let options = {
      listTrees: (
        <Wizard.Page
          key="page_1"
          className="wizard__page-1"
          skipDefaultButtons={true}
          title="Phylogenetic Trees"
          small
        >
          <div className="wizard__page-1__subtitle">{this.state.taxonName}</div>
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
      ),
      selectTaxonAndProject: (
        <Wizard.Page
          key="wizard__page_2"
          title="Select organism and project"
          onLoad={this.loadProjectAndTaxonSearchContext}
          onContinue={this.canContinueWithTaxonAndProject}
        >
          <div className="wizard__page-2__subtitle" />
          <div className="wizard__page-2__searchbar">
            <div className="wizard__page-2__searchbar__container">Project</div>
            <div className="wizard__page-2__searchbar__container">
              {this.state.projectsLoaded ? (
                <SearchBox
                  source={this.state.projectList}
                  onResultSelect={this.handleSelectProject}
                  initialValue={this.state.projectName}
                  placeholder="Existing project name"
                />
              ) : (
                <LoadingIcon />
              )}
            </div>
          </div>
          <div className="wizard__page-2__searchbar">
            <div className="wizard__page-2__searchbar__container">Organism</div>
            <div className="wizard__page-2__searchbar__container">
              {this.state.taxaLoaded ? (
                <SearchBox
                  source={this.state.taxonList}
                  onResultSelect={this.handleSelectTaxon}
                  initialValue={this.state.taxonName}
                  placeholder="Genus name"
                />
              ) : (
                <LoadingIcon />
              )}
            </div>
          </div>
          <div>
            {this.state.showErrorTaxonAndProject
              ? "Please select a project and organism"
              : null}
          </div>
        </Wizard.Page>
      ),
      selectNameAndProjectSamples: (
        <Wizard.Page
          key="wizard__page_3"
          title={`Create phylogenetic tree and select samples from project ${
            this.state.projectName
          }`}
          onLoad={this.loadNewTreeContext}
          onContinue={this.canContinueWithTreeName}
        >
          <div className="wizard__page-3__subtitle">{this.state.taxonName}</div>
          <div className="wizard__page-3__form">
            <div>
              <div className="wizard__page-3__form__label-name">Name</div>
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
                <div className="wizard__page-3__form__label-branch">Branch</div>
                <Input
                  placeholder="master"
                  onChange={this.handleBranchChange}
                />
              </div>
            )}
          </div>
          <div className="wizard__page-3__table">
            {this.state.samplesLoaded &&
            this.state.projectSamples.length > 0 ? (
              <DataTable
                headers={this.projectSamplesHeaders}
                columns={projectSamplesColumns}
                data={this.state.projectSamples}
                selectedRows={this.state.selectedProjectSamples}
                onSelectedRowsChanged={this.handleChangedProjectSamples}
              />
            ) : this.state.samplesLoaded &&
            this.state.projectSamples.length == 0 ? (
              <div>No samples containing {this.state.taxonName} available</div>
            ) : (
              <LoadingIcon />
            )}
          </div>
        </Wizard.Page>
      ),
      addIdseqSamples: (
        <Wizard.Page
          key="wizard__page_4"
          title={`Would you like additional samples from IDseq that contain ${
            this.state.taxonName
          }?`}
        >
          <div className="wizard__page-4__subtitle" />
          <div className="wizard__page-4__searchbar">
            <div className="wizard__page-4__searchbar__container">
              <Input placeholder="Search" onChange={this.handleFilterChange} />
            </div>
            <div className="wizard__page-4__searchbar__container">
              {this.state.selectedProjectSamples.size} Project Samples
            </div>
            <div className="wizard__page-4__searchbar__container">
              {this.state.selectedOtherSamples.size} IDseq Samples
            </div>
            <div className="wizard__page-4__searchbar__container">
              {this.getTotalPageRendering()}
            </div>
          </div>
          <div className="wizard__page-4__table">
            {this.state.samplesLoaded && this.state.otherSamples.length > 0 ? (
              <DataTable
                headers={this.otherSamplesHeaders}
                columns={otherSamplesColumns}
                data={this.state.otherSamples}
                selectedRows={this.state.selectedOtherSamples}
                onSelectedRowsChanged={this.handleChangedOtherSamples}
                filter={this.state.otherSamplesFilter}
              />
            ) : this.state.samplesLoaded &&
            this.state.otherSamples.length == 0 ? (
              <div>No samples containing {this.state.taxonName} available</div>
            ) : (
              <LoadingIcon />
            )}
          </div>
        </Wizard.Page>
      )
    };
    return options[action];
  }

  getPages() {
    let chosenPages = [];
    if (!this.state.skipListTrees) {
      chosenPages.push(this.page("listTrees"));
    }
    if (!this.skipSelectProjectAndTaxon) {
      chosenPages.push(this.page("selectTaxonAndProject"));
    }
    chosenPages.push(
      this.page("selectNameAndProjectSamples"),
      this.page("addIdseqSamples")
    );
    return chosenPages;
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
      return <LoadingIcon />;
    }
  }
}

PhyloTreeCreation.propTypes = {
  admin: PropTypes.number,
  csrf: PropTypes.string.isRequired,
  onComplete: PropTypes.func,
  projectId: PropTypes.number,
  taxonId: PropTypes.number
};

export default PhyloTreeCreation;
