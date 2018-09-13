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
      projectSamples: [],
      otherSamples: [],
      selectedSamples: {
        project: [],
        other: []
      }
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

    this.loadNewTreeContext = this.loadNewTreeContext.bind(this);
    this.handleNewTreeContextResponse = this.handleNewTreeContextResponse.bind(
      this
    );

    console.log(
      "PhyloTreeByPathCreation::constructor",
      this.props,
      this.props.taxonId,
      this.props.projectId
    );
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
        otherSamples: parsedTables.otherSamples
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
          key="page_0"
          className="page-one"
          skipDefaultButtons={true}
          title="Phylogenetic Trees"
        >
          <div className="page-one__subtitle">{this.taxonName}</div>
          <div className="page-one__table">
            <DataTable
              headers={this.phyloTreeHeaders}
              columns={["name", "user", "last_update", "view"]}
              data={this.state.phyloTrees}
            />
          </div>
          <div>
            <Wizard.Action action="continue">
              <p>+ Create new tree</p>
            </Wizard.Action>
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
        key="page_1"
        title="Create phylogenetic tree and choose samples to include:"
        onLoad={this.loadNewTreeContext}
      >
        <div className="page-two__subtitle">{this.taxonName}</div>
        <div className="page-two__form">
          <div>
            <div>Name</div>
            <Input placeholder="Name of the Tree" />
          </div>
        </div>
        <div className="page-two__table">
          <DataTable
            headers={this.projectSamplesHeaders}
            columns={["name", "host", "tissue", "location", "date", "reads"]}
            data={this.state.projectSamples}
          />
        </div>
      </Wizard.Page>,
      <Wizard.Page
        key="page_2"
        title={`Would you like to additional samples from IDSeq that contain ${
          this.taxonName
        }`}
      >
        <div className="page-three__searchbar">
          <div className="page-three__searchbar_container">
            <Input placeholder="Name of the Tree" />
          </div>
          <div className="page-three__searchbar_container">
            {this.state.selectedSamples.project.length} Project Samples
          </div>
          <div className="page-three__searchbar_container">
            {this.state.selectedSamples.other.length} IDSeq Samples
          </div>
          <div className="page-three__searchbar_container">
            {this.state.selectedSamples.project.length +
              this.state.selectedSamples.other.length}{" "}
            Total Samples
          </div>
        </div>
        <div>
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
          />
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
