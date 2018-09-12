import PropTypes from "prop-types";
import React from "react";
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
      phyloTrees: []
    };

    this.phyloTreeHeaders = {
      name: "Phylogenetic Tree",
      user: "Creator",
      last_update: "Last Updated",
      view: "View"
    };

    this.taxonName = null;
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
      .then(response => {
        console.log("load phylo trees", response.data);
        let phyloTrees = response.data.phyloTrees;
        if (
          !phyloTrees ||
          !Array.isArray(phyloTrees) ||
          phyloTrees.length === 0
        ) {
          console.log("skipping");
          this.setState({
            skipListTrees: true,
            phyloTreesLoaded: true
          });
        } else {
          console.log("load the data");
          this.taxonName = phyloTrees[0].tax_name;
          this.setState({
            phyloTrees: this.parsePhyloTreeData(response.data.phyloTrees),
            phyloTreesLoaded: true
          });
        }
      })
      .catch(error => {
        console.log("error phylo trees", error);
      });
  }

  parsePhyloTreeData(phyloTreeData) {
    return phyloTreeData.map(row => ({
      name: row.name,
      user: row.user.name,
      last_update: <Moment fromNow date={row.updated_at} />,
      view: <a href={`/phylo_trees/index?taxId=${row.taxId}`}>View</a>
    }));
  }

  setPage(defaultPage) {
    this.setState({ defaultPage });
  }

  getPages() {
    console.log(this.state.phyloTrees, this.state.skipListTrees);

    let pages = [];
    if (!this.state.skipListTrees) {
      pages.push(
        <Wizard.Page
          key={0}
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
    // <div className="page-one__link" onClick={() => this.setPage(1)}>
    //   + Create new tree
    // </div>
    pages.push(
      <Wizard.Page key={1} title="Testing Page 1">
        <div>Page 1</div>
        <div>Contents</div>
      </Wizard.Page>,
      <Wizard.Page key={2} title="Testing Page 2">
        <div>Page 2</div>
        <div>Contents</div>
      </Wizard.Page>
    );
    return pages;
  }

  render() {
    if (this.state.phyloTreesLoaded) {
      console.log("phylo trees loaded", this.state);
      return (
        <Wizard
          skipPageInfoNPages={this.state.skipListTrees ? 0 : 1}
          onComplete={this.props.onComplete}
          defaultPage={this.state.defaultPage}
        >
          {this.getPages()}
        </Wizard>
      );
    } else {
      console.log("phylo trees not loaded");
      return <div>Loading Phylo Trees...</div>;
    }
  }
}

export default PhyloTreeByPathCreation;
