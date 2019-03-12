import React from "react";
import { get, compact, pluck, values, sortBy, concat, find } from "lodash/fp";
import Tree from "../../utils/structures/Tree";
import Dendogram from "../../visualizations/dendrogram/Dendogram";
import PropTypes from "prop-types";
import DataTooltip from "../../ui/containers/DataTooltip";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import { getSampleMetadataFields } from "~/api";
import { SAMPLE_FIELDS, SAMPLE_METADATA_FIELDS } from "./constants";

const getAbsentName = attribute =>
  attribute === "project_name" ? "NCBI References" : "No data";

const EXTRA_DROPDOWN_OPTIONS = [
  {
    text: "Project Name",
    value: "project_name"
  },
  {
    text: "Host Genome Name",
    value: "host_genome_name"
  }
];

class PhyloTreeVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hoveredNode: null,
      // If we made the sidebar visibility depend on sampleId !== null,
      // there would be a visual flicker when sampleId is set to null as the sidebar closes.
      selectedSampleId: null,
      sidebarVisible: false,
      metadataFields: [],
      selectedMetadataType:
        props.defaultMetadata || EXTRA_DROPDOWN_OPTIONS[0].value
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
      absentColor: "#999999",
      colormapName: "viridis",
      colorGroupAttribute: EXTRA_DROPDOWN_OPTIONS[0].value,
      colorGroupLegendTitle: EXTRA_DROPDOWN_OPTIONS[0].text,
      // Name for the legend when the attribute is missing / other
      colorGroupAbsentName: getAbsentName(EXTRA_DROPDOWN_OPTIONS[0].value),
      tooltipContainer: this.tooltipContainer,
      onNodeTextClick: this.handleNodeClick,
      onNodeHover: this.handleNodeHover,
      scaleLabel: "Relative distance"
    });
    this.treeVis.update();

    this.fetchMetadataTypes();
    this.handleMetadataTypeChange(this.state.selectedMetadataType, "");
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
      this.fetchMetadataTypes();
    }

    // Close the sidebar if we switch trees.
    if (this.props.phyloTreeId != prevProps.phyloTreeId) {
      this.handleSidebarClose();
    }
  }

  fetchMetadataTypes = async () => {
    // Get ids and remove undefined, since nodeData includes NCBI and genbank.
    const sampleIds = compact(pluck("id", values(this.props.nodeData)));
    let metadataFields = await getSampleMetadataFields(sampleIds);

    this.setState({
      metadataFields
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
      this.props.onSampleNodeClick(
        node.data.sample_id,
        node.data.pipeline_run_id
      );
    }
  };

  handleSidebarClose = () => {
    this.setState({
      sidebarVisible: false
    });
  };

  handleMetadataTypeChange = (selectedMetadataType, name) => {
    this.setState({
      selectedMetadataType
    });

    // This path will be used by lodash.get on the node data.
    const path = find({ value: selectedMetadataType }, EXTRA_DROPDOWN_OPTIONS)
      ? selectedMetadataType
      : `metadata.${selectedMetadataType}`;

    this.treeVis.updateOptions({
      colorGroupAttribute: path,
      colorGroupLegendTitle: name,
      colorGroupAbsentName: getAbsentName(selectedMetadataType)
    });
    this.props.afterSelectedMetadataChange(selectedMetadataType);
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
          ...SAMPLE_METADATA_FIELDS.map(key => {
            return [
              get("name", find(["key", key], this.state.metadataFields)) || key,
              this.getMetadataFieldValue(key) || "-"
            ];
          })
        ]
      }
    ];
  }

  getMetadataDropdownOptions = () => {
    const metadataOptions = this.state.metadataFields.map(metadataType => ({
      text: metadataType.name,
      value: metadataType.key
    }));

    return sortBy(
      "text",
      concat(EXTRA_DROPDOWN_OPTIONS, metadataOptions),
      metadataOptions
    );
  };

  render() {
    return (
      <div className="phylo-tree-vis">
        <div className="phylo-tree-vis__metadata-select">
          <Dropdown
            fluid
            rounded
            search
            options={this.getMetadataDropdownOptions()}
            label="Color by"
            onChange={this.handleMetadataTypeChange}
            value={this.state.selectedMetadataType}
            menuLabel="Select Metadata Field"
          />
        </div>
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
  nodeData: PropTypes.object,
  onMetadataUpdate: PropTypes.func,
  phyloTreeId: PropTypes.number,
  onSampleNodeClick: PropTypes.func,
  defaultMetadata: PropTypes.string
};

export default PhyloTreeVis;
