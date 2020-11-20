import React from "react";
import { fromPairs, set, find } from "lodash/fp";
import PropTypes from "prop-types";

import { SaveButton, ShareButton } from "~ui/controls/buttons";
import BasicPopup from "~/components/BasicPopup";
import { getPhyloTree, saveVisualization } from "~/api";
import { logAnalyticsEvent, withAnalytics } from "~/api/analytics";
import NarrowContainer from "~/components/layout/NarrowContainer";
import DetailsSidebar from "~/components/common/DetailsSidebar";
import { copyShortUrlToClipboard, parseUrlParams } from "~/helpers/url";

import Divider from "../../layout/Divider";
import ViewHeader from "../../layout/ViewHeader/ViewHeader";
import PhyloTreeDownloadButton from "./PhyloTreeDownloadButton";
import PhyloTreeVis from "./PhyloTreeVis";
import cs from "./phylo_tree_list_view.scss";

class PhyloTreeListView extends React.Component {
  constructor(props) {
    super(props);

    const urlParams = parseUrlParams();

    this.state = {
      currentTree: null,
      phyloTreeMap: fromPairs(props.phyloTrees.map(tree => [tree.id, tree])),
      selectedPipelineRunId: null,
      selectedSampleId: null,
      selectedPhyloTreeId: this.getDefaultSelectedTreeId(
        urlParams,
        props.phyloTrees
      ),
      sidebarConfig: null,
      sidebarMode: null,
      sidebarVisible: false,
      treeContainer: null,
    };
    this.selectedMetadata = urlParams.selectedMetadata;
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

  async componentDidMount() {
    let currentTree = await getPhyloTree(this.state.selectedPhyloTreeId);
    this.setState({ currentTree });
  }

  handleTreeChange = async newPhyloTreeId => {
    // TODO (gdingle): do we want to keep using sessionStorage and cookies and urlparams and db saving?!
    window.sessionStorage.setItem("treeId", newPhyloTreeId);
    this.persistInUrl("treeId", newPhyloTreeId);
    let currentTree = await getPhyloTree(newPhyloTreeId);
    this.setState({
      selectedPhyloTreeId: newPhyloTreeId,
      currentTree: currentTree,
      sidebarVisible: false,
    });
    logAnalyticsEvent("PhyloTreeListView_phylo-tree_changed", {
      selectedPhyloTreeId: newPhyloTreeId,
    });
  };

  afterSelectedMetadataChange = selectedMetadata => {
    this.persistInUrl("selectedMetadata", selectedMetadata);
  };

  persistInUrl = (param, value) => {
    try {
      const url = new URL(window.location.href);
      url.searchParams.set(param, value);
      // TODO (gdingle): make back button load previous vis state
      history.replaceState(window.history.state, document.title, url);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error(e);
    }
  };

  handleMetadataUpdate = (key, newValue) => {
    // Update the metadata stored locally.
    this.setState({
      currentTree: set(
        [
          "sampleDetailsByNodeName",
          this.state.selectedPipelineRunId,
          "metadata",
          key,
        ],
        newValue,
        this.state.currentTree
      ),
    });
  };

  handleShareClick = async () => {
    await copyShortUrlToClipboard();
  };

  handleSaveClick = async () => {
    // TODO (gdingle): add analytics tracking?
    let params = parseUrlParams();
    const sampleIds = Object.values(
      this.state.currentTree.sampleDetailsByNodeName
    )
      .map(details => details.sample_id)
      .filter(s => !!s);
    params.sampleIds = new Set(sampleIds);
    await saveVisualization("phylo_tree", params);
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

  handleTaxonModeOpen = () => {
    const currentTree = this.state.currentTree;
    if (
      this.state.sidebarMode === "taxonDetails" &&
      this.state.sidebarVisible &&
      currentTree.taxid === this.state.sidebarConfig.taxonId
    ) {
      this.setState({
        sidebarVisible: false,
      });
      logAnalyticsEvent("PhyloTreeListView_taxon-details-sidebar_closed", {
        sidebarMode: "taxonDetails",
        treeName: currentTree.name,
        treeId: currentTree.id,
      });
    } else {
      this.setState({
        sidebarVisible: true,
        sidebarConfig: {
          parentTaxonId: currentTree.parent_taxid,
          taxonId: currentTree.taxid,
          taxonName: currentTree.tax_name,
        },
        sidebarMode: "taxonDetails",
      });
      logAnalyticsEvent("PhyloTreeListView_taxon-details-sidebar_opened", {
        sidebarMode: "taxonDetails",
        treeName: currentTree.name,
        treeId: currentTree.id,
        parentTaxonId: currentTree.parent_taxid,
        taxonId: currentTree.taxid,
        taxonName: currentTree.tax_name,
      });
    }
  };

  handleSampleNodeClick = (sampleId, pipelineRunId) => {
    if (!sampleId) {
      this.setState({
        sidebarVisible: false,
      });
      return;
    }

    if (
      this.state.sidebarVisible &&
      this.state.sidebarMode === "sampleDetails" &&
      this.state.selectedSampleId === sampleId
    ) {
      this.setState({
        sidebarVisible: false,
      });
      logAnalyticsEvent("PhyloTreeListView_sample-details-sidebar_closed", {
        sidebarMode: "sampleDetails",
        selectedSampleId: sampleId,
      });
    } else {
      this.setState({
        selectedSampleId: sampleId,
        selectedPipelineRunId: pipelineRunId,
        sidebarConfig: {
          sampleId,
          onMetadataUpdate: this.handleMetadataUpdate,
          showReportLink: true,
        },
        sidebarMode: "sampleDetails",
        sidebarVisible: true,
      });
      logAnalyticsEvent("PhyloTreeListView_sample-details-sidebar_opened", {
        sidebarMode: "sampleDetails",
        selectedSampleId: sampleId,
      });
    }
  };

  closeSidebar = () => {
    this.setState({
      sidebarVisible: false,
    });
  };

  render() {
    const { treeContainer } = this.state;

    if (!this.state.selectedPhyloTreeId) {
      return (
        <div className={cs.noTreeBanner}>
          No phylogenetic trees were found. You can create trees from the report
          page.
        </div>
      );
    }

    if (!this.state.currentTree) {
      return null;
    }

    let currentTree = this.state.currentTree;
    return (
      <div className={cs.phyloTreeListView}>
        <NarrowContainer>
          <ViewHeader title="Phylogenetic Trees" className={cs.viewHeader}>
            <ViewHeader.Content>
              <ViewHeader.Pretitle>
                Phylogenetic Tree{" "}
                {currentTree.tax_name && (
                  <span>
                    &nbsp;-&nbsp;
                    <span
                      className={cs.taxonName}
                      onClick={this.handleTaxonModeOpen}
                    >
                      {currentTree.tax_name}
                    </span>
                  </span>
                )}
              </ViewHeader.Pretitle>
              <ViewHeader.Title
                label={currentTree.name}
                id={this.state.selectedPhyloTreeId}
                options={this.props.phyloTrees.map(tree => ({
                  label: tree.name,
                  id: tree.id,
                  onClick: () => this.handleTreeChange(tree.id),
                }))}
              />
            </ViewHeader.Content>
            <ViewHeader.Controls className={cs.controls}>
              <BasicPopup
                trigger={
                  <ShareButton
                    onClick={withAnalytics(
                      this.handleShareClick,
                      "PhyloTreeListView_share-button_clicked",
                      {
                        treeName: currentTree.name,
                        treeId: currentTree.id,
                      }
                    )}
                    className={cs.controlElement}
                  />
                }
                content="A shareable URL was copied to your clipboard!"
                on="click"
                hideOnScroll
              />
              <SaveButton
                onClick={withAnalytics(
                  this.handleSaveClick,
                  "PhyloTreeListView_save-button_clicked",
                  {
                    treeName: currentTree.name,
                    treeId: currentTree.id,
                  }
                )}
                className={cs.controlElement}
              />
              <PhyloTreeDownloadButton
                className={cs.controlElement}
                tree={currentTree}
                treeContainer={treeContainer}
              />
            </ViewHeader.Controls>
          </ViewHeader>
        </NarrowContainer>
        <Divider />
        <DetailsSidebar
          visible={this.state.sidebarVisible}
          mode={this.state.sidebarMode}
          onClose={withAnalytics(
            this.closeSidebar,
            "PhyloTreeListView_details-sidebar_closed",
            {
              treeName: currentTree.name,
              treeId: currentTree.id,
            }
          )}
          params={this.state.sidebarConfig}
        />
        <NarrowContainer>
          {currentTree.newick ? (
            <PhyloTreeVis
              afterSelectedMetadataChange={this.afterSelectedMetadataChange}
              defaultMetadata={this.selectedMetadata}
              newick={currentTree.newick}
              nodeData={currentTree.sampleDetailsByNodeName}
              onMetadataUpdate={this.handleMetadataUpdate}
              onNewTreeContainer={t => this.setState({ treeContainer: t })}
              onSampleNodeClick={this.handleSampleNodeClick}
              phyloTreeId={this.state.selectedPhyloTreeId}
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
  phyloTrees: PropTypes.array,
  allowedFeatures: PropTypes.array,
};

export default PhyloTreeListView;
