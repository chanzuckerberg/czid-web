import React from "react";
import { fromPairs, set, find } from "lodash/fp";
import Divider from "../../layout/Divider";
import PhyloTreeVis from "./PhyloTreeVis";
import PhyloTreeDownloadButton from "./PhyloTreeDownloadButton";
import NarrowContainer from "~/components/layout/NarrowContainer";
import PropTypes from "prop-types";
import { resetUrl, parseUrlParams } from "~/helpers/url";
import ViewHeader from "../../layout/ViewHeader/ViewHeader";
import cs from "./phylo_tree_list_view.scss";

class PhyloTreeListView extends React.Component {
  constructor(props) {
    super(props);

    let urlParams = this.parseUrlParams();
    resetUrl();

    this.state = {
      selectedPhyloTreeId: this.getDefaultSelectedTreeId(
        urlParams,
        props.phyloTrees
      ),
      phyloTreeMap: fromPairs(props.phyloTrees.map(tree => [tree.id, tree]))
    };
  }

  getDefaultSelectedTreeId(urlParams, phyloTrees = []) {
    const selectedId =
      urlParams.treeId || parseInt(window.sessionStorage.getItem("treeId"));

    // If the selected tree doesn't exist, default to the first one.
    if (!selectedId || !find({ id: selectedId }, phyloTrees)) {
      return (phyloTrees[0] || {}).id;
    }

    return selectedId;
  }

  parseUrlParams() {
    let urlParams = parseUrlParams();
    urlParams.treeId = parseInt(urlParams.treeId);
    return urlParams;
  }

  handleTreeChange = newPhyloTreeId => {
    window.sessionStorage.setItem("treeId", newPhyloTreeId);
    this.setState({
      selectedPhyloTreeId: newPhyloTreeId
    });
  };

  handleMetadataUpdate = (key, newValue, pipelineRunId) => {
    // Update the metadata stored locally.
    this.setState({
      phyloTreeMap: set(
        [
          this.state.selectedPhyloTreeId,
          "sampleDetailsByNodeName",
          pipelineRunId,
          "metadata",
          key
        ],
        newValue,
        this.state.phyloTreeMap
      )
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
        <div className={cs.noTreeBanner}>
          No phylogenetic trees were found. You can create trees from the report
          page.
        </div>
      );
    }

    let currentTree = this.state.phyloTreeMap[this.state.selectedPhyloTreeId];
    return (
      <div className={cs.phyloTreeListView}>
        <ViewHeader title="Phylogenetic Trees" className={cs.viewHeader}>
          <ViewHeader.Content>
            <ViewHeader.Pretitle>
              Phylogenetic Tree{" "}
              {currentTree.tax_name && `- ${currentTree.tax_name}`}
            </ViewHeader.Pretitle>
            <ViewHeader.Title
              label={currentTree.name}
              id={this.state.selectedPhyloTreeId}
              options={this.props.phyloTrees.map(tree => ({
                label: tree.name,
                id: tree.id,
                onClick: () => this.handleTreeChange(tree.id)
              }))}
            />
          </ViewHeader.Content>
          <ViewHeader.Controls>
            <PhyloTreeDownloadButton tree={currentTree} />
          </ViewHeader.Controls>
        </ViewHeader>
        <Divider />
        <NarrowContainer>
          {currentTree.newick ? (
            <PhyloTreeVis
              newick={currentTree.newick}
              nodeData={currentTree.sampleDetailsByNodeName}
              phyloTreeId={this.state.selectedPhyloTreeId}
              onMetadataUpdate={this.handleMetadataUpdate}
            />
          ) : (
            <p className={cs.noTreeBanner}>
              {this.getTreeStatus(currentTree.status)}
            </p>
          )}
        </NarrowContainer>
      </div>
    );
  }
}

PhyloTreeListView.propTypes = {
  phyloTrees: PropTypes.array
};

export default PhyloTreeListView;
