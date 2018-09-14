import PropTypes from "prop-types";
import React from "react";
import Input from "../../ui/controls/Input";
import Wizard from "../../ui/containers/Wizard";
import axios from "axios";
import DataTable from "../../visualizations/table/DataTable";
import Moment from "react-moment";

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
      otherSamplesFilter: ""
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
      reads: "Read Count (NT | NR)"
    };

    this.taxonName = null;
    this.inputTimeout = null;
    this.inputDelay = 500;

    this.loadNewTreeContext = this.loadNewTreeContext.bind(this);
    this.handleNewTreeContextResponse = this.handleNewTreeContextResponse.bind(
      this
    );
    this.handleChangedProjectSamples = this.handleChangedProjectSamples.bind(
      this
    );
    this.handleChangedOtherSamples = this.handleChangedOtherSamples.bind(this);
    this.handleFilterChange = this.handleFilterChange.bind(this);
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
        console.log("Error loading existing phylo trees: ", error);
      });
  }

  loadNewTreeContext() {
    console.log(this.props);
    axios
      .get("/phylo_trees/new.json", {
        params: {
          taxId: this.props.taxonId,
          projectId: this.props.projectId
        }
      })
      .then(response => this.handleNewTreeContextResponse(response))
      .catch(error => {
        console.log("Error loading new phylo tree context: ", error);
      });
  }

  handlePhyloTreeResponse(response) {
    console.log(
      "PhyloTreeByPathCreation::handlePhyloTreeResponse - data",
      response.data
    );
    let phyloTrees = response.data.phyloTrees;
    if (!phyloTrees || !Array.isArray(phyloTrees) || phyloTrees.length === 0) {
      console.log(
        "PhyloTreeByPathCreation::handlePhyloTreeResponse - skipping"
      );
      this.setState({
        skipListTrees: true,
        phyloTreesLoaded: true
      });
    } else {
      console.log(
        "PhyloTreeByPathCreation::handlePhyloTreeResponse - load the data"
      );
      this.taxonName = phyloTrees[0].tax_name;
      this.setState({
        phyloTrees: this.parsePhyloTreeData(response.data.phyloTrees),
        phyloTreesLoaded: true
      });
    }
  }

  handleNewTreeContextResponse(response) {
    console.log(
      "PhyloTreeByPathCreation::handleNewTreeContextResponse - new tree context",
      response.data
    );
    let samplesData = response.data.samples;
    if (
      !samplesData ||
      !Array.isArray(samplesData) ||
      samplesData.length === 0
    ) {
      console.error("Process error on samples data");
    } else {
      console.log(
        "PhyloTreeByPathCreation::handleNewTreeContextResponse - settng state"
      );
      let parsedTables = this.parseProjectSamplesData(samplesData);
      console.log(
        "PhyloTreeByPathCreation::handleNewTreeContextResponse - parsedTables",
        parsedTables
      );
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
      view: <a href={`/phylo_trees/index?taxId=${row.taxId}`}>View</a>
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

  getPages() {
    console.log(
      "PhyloTreeByPathCreation::getPages",
      this.state.phyloTrees,
      this.state.skipListTrees
    );

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
    console.log(
      "PhyloTreeByPathCreation::getPages - pushing with ",
      this.state.projectSamples
    );
    pages.push(
      <Wizard.Page
        key="wizard__page_2"
        title="Create phylogenetic tree and samples from project"
        onLoad={this.loadNewTreeContext}
      >
        <div className="wizard__page-2__subtitle">{this.taxonName}</div>
        <div className="wizard__page-2__form">
          <div className="wizard__page-2__form__label">Name</div>
          <Input placeholder="Name of the Tree" />
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
      console.log(
        "PhyloTreeByPathCreation::render - phylo trees",
        this.state.phyloTrees
      );
      console.log(
        "PhyloTreeByPathCreation::render - project samples",
        this.state.projectSamples
      );
      console.log(
        "PhyloTreeByPathCreation::render - other samples",
        this.state.otherSamples
      );
      return (
        <Wizard
          skipPageInfoNPages={this.state.skipListTrees ? 0 : 1}
          onComplete={this.props.onComplete}
          defaultPage={this.state.defaultPage}
          labels={{
            finish: "Create Table"
          }}
        >
          {this.getPages()}
        </Wizard>
      );
    } else {
      console.log("PhyloTreeByPathCreation::render - phylo trees not loaded");
      return <div>Loading Phylo Trees...</div>;
    }
  }
}

export default PhyloTreeByPathCreation;
