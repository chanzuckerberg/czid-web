import React from "react";
import Divider from "../../layout/Divider";
import Dropdown from "../../ui/controls/dropdowns/Dropdown";
import FilterRow from "../../layout/FilterRow";
import QueryString from "query-string";
import PhyloTreeVis from "./PhyloTreeVis";
import PhyloTreeDownloadButton from "./PhyloTreeDownloadButton";
import PropTypes from "prop-types";
import ViewHeader from "../../layout/ViewHeader";

class PhyloTreeListView extends React.Component {
  constructor(props) {
    super(props);

    let urlParams = this.parseUrlParams();
    this.resetUrl();

    this.phyloTreeMap = new Map(props.phyloTrees.map(tree => [tree.id, tree]));

    this.state = {
      selectedPhyloTreeId: this.getDefaultSelectedTreeId(
        urlParams,
        props.phyloTrees
      )
    };

    this.handleTreeChange = this.handleTreeChange.bind(this);
  }

  getDefaultSelectedTreeId(urlParams, phyloTrees = []) {
    return (
      urlParams.treeId ||
      parseInt(window.sessionStorage.getItem("treeId")) ||
      (phyloTrees[0] || {}).id
    );
  }

  resetUrl() {
    // remove parameters from url
    window.history.replaceState({}, document.title, location.pathname);
  }

  parseUrlParams() {
    let urlParams = QueryString.parse(location.search, {
      arrayFormat: "bracket"
    });
    urlParams.treeId = parseInt(urlParams.treeId);
    return urlParams;
  }

  handleTreeChange(_, newPhyloTreeId) {
    window.sessionStorage.setItem("treeId", newPhyloTreeId.value);
    this.setState({
      selectedPhyloTreeId: newPhyloTreeId.value
    });
  }

  getTreeStatus(tree) {
    let statusMessage = "";
    switch (tree) {
      case 0:
      case 3:
        statusMessage = "Computation in progress. Please check back later!";
        break;
      case 2:
        statusMessage = "Tree creation failed!";
        break;
      default:
        // TODO: process error
        statusMessage = "Tree unavailable!";
        break;
    }
    return statusMessage;
  }

  render() {
    if (!this.state.selectedPhyloTreeId) {
      return (
        <p className="phylo-tree-list-view__no-tree-banner">
          No trees yet. You can create trees from the report page.
        </p>
      );
    }

    let currentTree = this.phyloTreeMap.get(this.state.selectedPhyloTreeId);
    return (
      <div className="phylo-tree-list-view">
        <div className="phylo-tree-list-view__narrow-container">
          <ViewHeader title="Phylogenetic Trees">
            <PhyloTreeDownloadButton tree={currentTree} />
          </ViewHeader>
        </div>
        <Divider />
        <div className="phylo-tree-list-view__narrow-container">
          <FilterRow>
            <Dropdown
              label="Tree: "
              onChange={this.handleTreeChange}
              options={this.props.phyloTrees.map(tree => ({
                value: tree.id,
                text: tree.name
              }))}
              value={this.state.selectedPhyloTreeId}
            />
          </FilterRow>
        </div>
        <Divider />
        <div className="phylo-tree-list-view__narrow-container">
          {currentTree.newick ? (
            <PhyloTreeVis
              newick={currentTree.newick}
              nodeData={currentTree.sampleDetailsByNodeName}
            />
          ) : (
            <p className="phylo-tree-list-view__no-tree-banner">
              {this.getTreeStatus(currentTree.status)}
            </p>
          )}
        </div>
      </div>
    );
  }
}

PhyloTreeListView.propTypes = {
  phyloTrees: PropTypes.array
};

export default PhyloTreeListView;
