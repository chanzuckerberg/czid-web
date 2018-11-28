import React from "react";
import { get, keyBy } from "lodash/fp";
import Tree from "../../utils/structures/Tree";
import Dendogram from "../../visualizations/dendrogram/Dendogram";
import PropTypes from "prop-types";
import DataTooltip from "../../ui/containers/DataTooltip";
import SampleDetailsSidebar from "../report/SampleDetailsSidebar";
import { getMetadataTypes } from "~/api";
import { SAMPLE_FIELDS, SAMPLE_METADATA_FIELDS } from "./constants";

class PhyloTreeVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hoveredNode: null,
      // If we made the sidebar visibility depend on sampleId !== null,
      // there would be a visual flicker when sampleId is set to null as the sidebar closes.
      selectedSampleId: null,
      selectedPipelineRunId: null,
      sidebarVisible: false
    };

    (this.newick = props.newick),
      (this.nodeData = props.nodeData),
      (this.treeVis = null);

    this.ncbiFields = [
      { name: "country", label: "Country" },
      { name: "collection_date", label: "Collection Date" }
    ];
  }

  componentDidMount() {
    let tree = Tree.fromNewickString(this.props.newick, this.props.nodeData);
    this.treeVis = new Dendogram(this.treeContainer, tree, {
      defaultColor: "#cccccc",
      colormapName: "viridis",
      colorGroupAttribute: "project_name",
      colorGroupLegendTitle: "Project Name",
      // Name for the legend when the attribute is missing / other
      colorGroupAbsentName: "NCBI References",
      legendX: 880,
      legendY: -150,
      tooltipContainer: this.tooltipContainer,
      onNodeTextClick: this.handleNodeClick,
      onNodeHover: this.handleNodeHover,
      scaleLabel: "Relative distance"
    });
    this.treeVis.update();

    this.fetchMetadataTypes();
  }

  componentDidUpdate(prevProps) {
    if (
      this.props.newick != this.newick ||
      this.props.nodeData != this.nodeData
    ) {
      this.newick = this.props.newick;
      this.nodeData = this.props.nodeData;
      this.treeVis.setTree(
        Tree.fromNewickString(this.props.newick, this.props.nodeData)
      );
      this.treeVis.update();
    }

    // Close the sidebar if we switch trees.
    if (this.props.phyloTreeId != prevProps.phyloTreeId) {
      this.handleSidebarClose();
    }
  }

  fetchMetadataTypes = async () => {
    const metadataTypes = await getMetadataTypes();

    this.setState({
      sampleMetadataTypes: keyBy("key", metadataTypes)
    });
  };

  handleNodeHover = node => {
    this.setState({ hoveredNode: node });
  };

  handleNodeClick = node => {
    if (node.data.accession) {
      let url = `https://www.ncbi.nlm.nih.gov/nuccore/${node.data.accession}`;
      window.open(url, "_blank", "noopener", "noreferrer");
    } else if (node.data.sample_id) {
      if (
        this.state.sidebarVisible &&
        this.state.selectedSampleId === node.data.sample_id
      ) {
        this.handleSidebarClose();
      } else {
        this.setState({
          selectedSampleId: node.data.sample_id,
          selectedPipelineRunId: node.data.pipeline_run_id,
          sidebarVisible: true
        });
      }
    }
  };

  handleSidebarClose = () => {
    this.setState({
      sidebarVisible: false
    });
  };

  handleMetadataUpdate = (key, newValue) => {
    if (this.props.onMetadataUpdate) {
      this.props.onMetadataUpdate(
        key,
        newValue,
        this.state.selectedPipelineRunId
      );
    }
  };

  getFieldValue(field) {
    let value = this.state.hoveredNode.data[field.name];
    if (value && field.parser) {
      try {
        value = field.parser(value);
      } catch (err) {
        // TODO: handle error properly
        // eslint-disable-next-line no-console
        console.error(`Error parsing: ${field.name}`);
      }
    }
    return value || "-";
  }

  getMetadataFieldValue = field =>
    get(`metadata.${field}`, this.state.hoveredNode.data);

  getTooltipData() {
    if (this.state.hoveredNode.data.accession) {
      return [
        {
          name: "NCBI Reference",
          data: this.ncbiFields.map(f => [
            f.label,
            this.getFieldValue(f) || "-"
          ])
        }
      ];
    }

    return [
      {
        name: "Sample",
        data: [
          ...SAMPLE_FIELDS.map(f => [f.label, this.getFieldValue(f) || "-"]),
          ...SAMPLE_METADATA_FIELDS.map(key => [
            get(`${key}.name`, this.state.sampleMetadataTypes) || key,
            this.getMetadataFieldValue(key) || "-"
          ])
        ]
      }
    ];
  }

  render() {
    return (
      <div className="phylo-tree-vis">
        <div
          className="phylo-tree-vis__tree-container"
          ref={container => {
            this.treeContainer = container;
          }}
        />
        <div
          className="phylo-tree-vis__tooltip-container"
          ref={tooltip => {
            this.tooltipContainer = tooltip;
          }}
        >
          {this.state.hoveredNode && (
            <DataTooltip data={this.getTooltipData()} />
          )}
        </div>
        <SampleDetailsSidebar
          showReportLink
          visible={this.state.sidebarVisible}
          onClose={this.handleSidebarClose}
          sampleId={this.state.selectedSampleId}
          onMetadataUpdate={this.handleMetadataUpdate}
        />
      </div>
    );
  }
}

PhyloTreeVis.propTypes = {
  newick: PropTypes.string,
  nodeData: PropTypes.object,
  onMetadataUpdate: PropTypes.func,
  phyloTreeId: PropTypes.number
};

export default PhyloTreeVis;
