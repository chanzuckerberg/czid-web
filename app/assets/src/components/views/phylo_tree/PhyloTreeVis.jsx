import React from "react";
import Tree from "../../utils/structures/Tree";
import Dendogram from "../../visualizations/dendrogram/Dendogram";
import PropTypes from "prop-types";
import DataTooltip from "../../ui/containers/DataTooltip";
import { SAMPLE_FIELDS } from "../../utils/SampleFields";

class PhyloTreeVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hoveredNode: null
    };

    (this.newick = props.newick),
      (this.nodeData = props.nodeData),
      (this.treeVis = null);

    this.handleNodeHover = this.handleNodeHover.bind(this);

    this.sampleFields = SAMPLE_FIELDS;
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
  }

  componentDidUpdate() {
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
  }

  handleNodeHover(node) {
    this.setState({ hoveredNode: node });
  }

  handleNodeClick(node) {
    if (node.data.accession) {
      let url = `https://www.ncbi.nlm.nih.gov/nuccore/${node.data.accession}`;
      window.open(url, "_blank", "noopener", "noreferrer");
    } else if (node.data.id) {
      location.href = `/samples/${node.data.id}`;
    }
  }

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

  getTooltipData() {
    let fields = this.state.hoveredNode.data.accession
      ? this.ncbiFields
      : this.sampleFields;

    let sectionName = null;
    if (this.state.hoveredNode.data.accession) {
      sectionName = "NCBI Reference";
    } else {
      sectionName = "Sample";
    }
    return [
      {
        name: sectionName,
        data: fields.map(f => [f.label, this.getFieldValue(f) || "-"])
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
      </div>
    );
  }
}

PhyloTreeVis.propTypes = {
  newick: PropTypes.string,
  nodeData: PropTypes.object
};

export default PhyloTreeVis;
