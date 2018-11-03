import React from "react";
import Divider from "../../layout/Divider";
import QueryString from "query-string";
import PhyloTreeVis from "./PhyloTreeVis";
import PhyloTreeDownloadButton from "./PhyloTreeDownloadButton";
import PropTypes from "prop-types";
import ViewHeader from "../../layout/ViewHeader/ViewHeader";
import cs from "./phylo_tree_list_view.scss";

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

  handleTreeChange = newPhyloTreeId => {
    window.sessionStorage.setItem("treeId", newPhyloTreeId);
    this.setState({
      selectedPhyloTreeId: newPhyloTreeId
    });
  };

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
        <p className={cs.noTreeBanner}>
          No trees yet. You can create trees from the report page.
        </p>
      );
    }

    let currentTree = this.phyloTreeMap.get(this.state.selectedPhyloTreeId);
    return (
      <div className={cs.phyloTreeListView}>
        <div className={cs.narrowContainer}>
          <ViewHeader title="Phylogenetic Trees" className={cs.viewHeader}>
            <ViewHeader.Content>
              <div className={cs.preTitle}>Phylogenetic Tree</div>
              <ViewHeader.Title
                label={
                  this.phyloTreeMap.get(this.state.selectedPhyloTreeId).name
                }
                id={this.state.selectedPhyloTreeId}
                options={this.props.phyloTrees.map(tree => ({
                  label: tree.name,
                  id: tree.id,
                  onClick: () => this.handleTreeChange(tree.id)
                }))}
              />
            </ViewHeader.Content>
            <ViewHeader.RightControls>
              <PhyloTreeDownloadButton tree={currentTree} />
            </ViewHeader.RightControls>
          </ViewHeader>
        </div>
        <Divider />
        <div className={cs.narrowContainer}>
          {currentTree.newick ? (
            <PhyloTreeVis
              newick={currentTree.newick}
              nodeData={currentTree.sampleDetailsByNodeName}
            />
          ) : (
            <p className={cs.noTreeBanner}>
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
