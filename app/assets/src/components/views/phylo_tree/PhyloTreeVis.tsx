import { compact, concat, find, get, pluck, sortBy, values } from "lodash/fp";
import React from "react";
import { getSampleMetadataFields } from "~/api/metadata";
import ColumnHeaderTooltip from "~/components/ui/containers/ColumnHeaderTooltip";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import TooltipVizTable from "../../ui/containers/TooltipVizTable";
import Tree from "../../utils/structures/Tree";
import Dendogram from "../../visualizations/dendrogram/Dendogram";
import {
  SAMPLE_FIELDS,
  SAMPLE_METADATA_FIELDS,
  SAMPLE_METRIC_FIELDS,
} from "./constants";

const getAbsentName = (attribute: $TSFixMe) =>
  attribute === "project_name" ? "NCBI References" : "No data";

const EXTRA_DROPDOWN_OPTIONS = [
  {
    text: "Project Name",
    value: "project_name",
  },
  {
    text: "Host Genome Name",
    value: "host_genome_name",
  },
];

interface PhyloTreeVisProps {
  afterSelectedMetadataChange?: $TSFixMeFunction;
  defaultMetadata?: string;
  newick?: string;
  nodeData?: object;
  onMetadataUpdate?: $TSFixMeFunction;
  onNewTreeContainer?: $TSFixMeFunction;
  onSampleNodeClick?: $TSFixMeFunction;
  phyloTreeId?: number;
}

interface PhyloTreeVisState {
  hoveredNode: { data: { accession: $TSFixMeUnknown } };
  // If we made the sidebar visibility depend on sampleId !== null,
  // there would be a visual flicker when sampleId is set to null as the sidebar closes.
  selectedSampleId: $TSFixMeUnknown;
  sidebarVisible: boolean;
  metadataFields: $TSFixMeUnknown[];
  selectedMetadataType: string;
  showWarningTooltip: boolean;
}

class PhyloTreeVis extends React.Component<
  PhyloTreeVisProps,
  PhyloTreeVisState
> {
  ncbiFields: $TSFixMe;
  newick: $TSFixMe;
  nodeData: $TSFixMe;
  tooltipContainer: $TSFixMe;
  treeContainer: $TSFixMe;
  treeVis: $TSFixMe;
  warningTooltipContainer: $TSFixMe;
  constructor(props: PhyloTreeVisProps) {
    super(props);

    this.state = {
      hoveredNode: null,
      // If we made the sidebar visibility depend on sampleId !== null,
      // there would be a visual flicker when sampleId is set to null as the sidebar closes.
      selectedSampleId: null,
      sidebarVisible: false,
      metadataFields: [],
      selectedMetadataType:
        props.defaultMetadata || EXTRA_DROPDOWN_OPTIONS[0].value,
      showWarningTooltip: false,
    };

    this.newick = props.newick;
    this.nodeData = props.nodeData;
    this.treeVis = null;

    this.ncbiFields = [
      { name: "country", label: "Country" },
      { name: "collection_date", label: "Collection Date" },
    ];
  }

  componentDidMount() {
    const { onNewTreeContainer } = this.props;

    const tree = Tree.fromNewickString(this.props.newick, this.props.nodeData);
    this.treeVis = new Dendogram(this.treeContainer, tree, {
      defaultColor: "#cccccc",
      absentColor: "#999999",
      colormapName: "viridis",
      colorGroupAttribute: EXTRA_DROPDOWN_OPTIONS[0].value,
      colorGroupLegendTitle: EXTRA_DROPDOWN_OPTIONS[0].text,
      // Name for the legend when the attribute is missing / other
      colorGroupAbsentName: getAbsentName(EXTRA_DROPDOWN_OPTIONS[0].value),
      tooltipContainer: this.tooltipContainer,
      warningTooltipContainer: this.warningTooltipContainer,
      onWarningIconHover: this.handleWarningIconHover,
      onWarningIconExit: this.handleWarningIconExit,
      onNodeTextClick: this.handleNodeClick,
      onNodeHover: this.handleNodeHover,
      scaleLabel: "Relative distance",
    });
    this.treeVis.update();

    onNewTreeContainer(this.treeContainer);

    this.fetchMetadataTypes();
    this.handleMetadataTypeChange(this.state.selectedMetadataType, "");
  }

  componentDidUpdate(prevProps: PhyloTreeVisProps) {
    if (
      this.props.newick !== this.newick ||
      this.props.nodeData !== this.nodeData
    ) {
      this.newick = this.props.newick;
      this.nodeData = this.props.nodeData;
      this.treeVis.setTree(
        Tree.fromNewickString(this.props.newick, this.props.nodeData),
      );
      this.treeVis.update();
      this.fetchMetadataTypes();
    }

    // Close the sidebar if we switch trees.
    if (this.props.phyloTreeId !== prevProps.phyloTreeId) {
      this.handleSidebarClose();
    }
  }

  fetchMetadataTypes = async () => {
    // Get ids and remove undefined, since nodeData includes NCBI and genbank.
    const sampleIds = compact(pluck("sample_id", values(this.props.nodeData)));
    const metadataFields = await getSampleMetadataFields(sampleIds);

    this.setState({
      metadataFields,
    });
  };

  handleNodeHover = (node: $TSFixMe) => {
    this.setState({ hoveredNode: node });
  };

  handleWarningIconHover = () => {
    this.setState({ showWarningTooltip: true });
  };

  handleWarningIconExit = () => {
    this.setState({ showWarningTooltip: false });
  };

  handleNodeClick = (node: $TSFixMe) => {
    if (node.data.accession) {
      const url = `https://www.ncbi.nlm.nih.gov/nuccore/${node.data.accession}`;
      // @ts-expect-error ts-migrate(2345) FIXME: Argument of type '"noreferrer"' is not assignable ... Remove this comment to see the full error message
      window.open(url, "_blank", "noopener", "noreferrer");
    } else if (node.data.sample_id) {
      this.props.onSampleNodeClick(
        node.data.sample_id,
        node.data.pipeline_run_id,
      );
    }
  };

  handleSidebarClose = () => {
    this.setState({
      sidebarVisible: false,
    });
  };

  handleMetadataTypeChange = (
    selectedMetadataType: $TSFixMe,
    name: $TSFixMe,
  ) => {
    this.setState({
      selectedMetadataType,
    });

    // This path will be used by lodash.get on the node data.
    const path = find({ value: selectedMetadataType }, EXTRA_DROPDOWN_OPTIONS)
      ? selectedMetadataType
      : `metadata.${selectedMetadataType}`;

    this.treeVis.updateOptions({
      colorGroupAttribute: path,
      colorGroupLegendTitle: name,
      colorGroupAbsentName: getAbsentName(selectedMetadataType),
    });
    this.props.afterSelectedMetadataChange(selectedMetadataType);
  };

  getFieldValue(field: $TSFixMe) {
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
    return value || field.default || "-";
  }

  getMetadataFieldValue = (field: $TSFixMe) =>
    get(`metadata.${field}`, this.state.hoveredNode.data);

  getTooltipData() {
    if (this.state.hoveredNode.data.accession) {
      const referenceInfo =
        "Reference samples are chosen from NCBI using our heuristic outlined in the Help Center.";
      return {
        data: [
          {
            name: "NCBI Reference",
            data: this.ncbiFields.map((f: $TSFixMe) => [
              f.label,
              this.getFieldValue(f) || "-",
            ]),
          },
        ],
        description: referenceInfo,
      };
    }
    return {
      data: [
        {
          name: "Info",
          data: [
            ...SAMPLE_FIELDS.map(f => [f.label, this.getFieldValue(f) || "-"]),
            ...SAMPLE_METADATA_FIELDS.map(key => {
              return [
                get("name", find(["key", key], this.state.metadataFields)) ||
                  key,
                this.getMetadataFieldValue(key) || "-",
              ];
            }),
          ],
        },
        {
          name: "Metrics",
          data: [
            ...SAMPLE_METRIC_FIELDS.map(f => [
              f.label,
              this.getFieldValue(f) || f.default,
            ]),
          ],
        },
      ],
    };
  }

  getMetadataDropdownOptions = () => {
    const metadataOptions = this.state.metadataFields.map(
      (metadataType: $TSFixMe) => ({
        text: metadataType.name,
        value: metadataType.key,
      }),
    );

    return sortBy(
      "text",
      concat(EXTRA_DROPDOWN_OPTIONS, metadataOptions),
      // @ts-expect-error ts-migrate(2554) FIXME: Expected 1-2 arguments, but got 3.
      metadataOptions,
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
            // @ts-expect-error Type 'LodashSortBy1x2<unknown>' not assignable to type
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
          }}>
          {this.state.hoveredNode && !this.state.showWarningTooltip && (
            <TooltipVizTable
              // @ts-expect-error Types of property 'data' are incompatible.
              data={this.getTooltipData().data}
              description={this.getTooltipData().description}
            />
          )}
        </div>
        <div
          className="phylo-tree-vis__tooltip-container"
          ref={tooltip => {
            this.warningTooltipContainer = tooltip;
          }}>
          {this.state.showWarningTooltip && (
            <ColumnHeaderTooltip
              content="Coverage breadth is less than 25%. This is low and may affect analysis quality. Learn more in our Help Center."
              open // Make sure the tooltip is visible as long as the container is visible.
              trigger={<div />} // Pass in an empty div because the tooltip requires a trigger element.
            />
          )}
        </div>
      </div>
    );
  }
}

export default PhyloTreeVis;
