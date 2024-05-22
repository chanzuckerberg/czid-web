import cx from "classnames";
import React from "react";
import MetadataLegend from "~/components/common/Heatmap/MetadataLegend";
import MetadataSelector from "~/components/common/Heatmap/MetadataSelector";
import { getTooltipStyle } from "~/components/utils/tooltip";
import Heatmap from "~/components/visualizations/heatmap/Heatmap";
import { TooltipVizTable } from "~ui/containers";
import cs from "./amr_heatmap_vis.scss";

const VIEW_LEVEL_ALLELES = "allele";
const VIEW_LEVEL_GENES = "gene";

const DEFAULT_SELECTED_METADATA = ["collection_location_v2"];

interface AMRHeatmapVisProps {
  samplesWithAMRCounts?: {
    sampleName?: string;
    sampleId?: number;
    metadata?: object;
    amrCounts?: unknown[];
    error?: string;
  }[];
  selectedOptions?: {
    metric?: string;
    viewLevel?: string;
    scale?: string;
  };
  onSampleLabelClick?: $TSFixMe;
  onGeneLabelClick?: $TSFixMe;
  samplesMetadataTypes?: object;
  sampleLabels?: {
    label?: string;
    id?: number;
    metadata?: object;
  }[];
  geneLabels?: {
    label?: string;
  }[];
  alleleLabels?: {
    label?: string;
  }[];
  alleleToGeneMap?: object;
  metrics?: {
    text?: string;
    value?: string;
  }[];
}

interface AMRHeatmapVisState {
  nodeHoverInfo: $TSFixMe;
  tooltipLocation: $TSFixMe;
  columnMetadataLegend: $TSFixMe;
  addMetadataTrigger: $TSFixMe;
  nodeHovered: boolean;
  metadataLabelHovered: boolean;
  selectedMetadata: Set<$TSFixMe>;
}

export default class AMRHeatmapVis extends React.Component<
  AMRHeatmapVisProps,
  AMRHeatmapVisState
> {
  heatmap: $TSFixMe;
  heatmapContainer: $TSFixMe;
  constructor(props: AMRHeatmapVisProps) {
    super(props);

    this.state = {
      nodeHoverInfo: null,
      tooltipLocation: null,
      columnMetadataLegend: null,
      addMetadataTrigger: null,
      nodeHovered: false,
      metadataLabelHovered: false,
      selectedMetadata: new Set(DEFAULT_SELECTED_METADATA),
    };

    this.heatmap = null;
  }

  componentDidMount() {
    this.updateHeatmap();
  }

  componentDidUpdate(
    prevProps: AMRHeatmapVisProps,
    prevState: AMRHeatmapVisState,
  ) {
    const { selectedMetadata } = this.state;
    const { sampleLabels, selectedOptions } = this.props;
    if (
      selectedOptions !== prevProps.selectedOptions ||
      sampleLabels !== prevProps.sampleLabels
    ) {
      this.updateHeatmap();
    }
    if (
      selectedMetadata !== prevState.selectedMetadata ||
      sampleLabels !== prevProps.sampleLabels
    ) {
      this.heatmap.updateColumnMetadata(this.getSelectedMetadataFields());
    }
  }

  getMetadataTypes() {
    const { samplesMetadataTypes } = this.props;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2769
    return Object.keys(samplesMetadataTypes)
      .sort()
      .map(type => {
        return {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          label: samplesMetadataTypes[type].name,
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          value: samplesMetadataTypes[type].key,
        };
      });
  }

  getTooltipData(node: $TSFixMe) {
    const {
      sampleLabels,
      alleleToGeneMap,
      samplesWithAMRCounts,
      selectedOptions,
      metrics,
    } = this.props;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const sampleName = sampleLabels[node.columnIndex].label;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const rowLabel = this.getHeatmapLabels()[node.rowIndex].label;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const sampleForColumn = samplesWithAMRCounts[node.columnIndex];

    const amrCountForNode = this.findAMRCountForName(rowLabel, sampleForColumn);

    let gene = "";
    let allele = "";
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    switch (selectedOptions.viewLevel) {
      case VIEW_LEVEL_ALLELES: {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        allele = rowLabel;
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        gene = alleleToGeneMap[allele];
        break;
      }
      case VIEW_LEVEL_GENES: {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
        gene = rowLabel;
        allele = amrCountForNode ? amrCountForNode.allele : "---";
        break;
      }
      default: {
        break;
      }
    }

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    const values = metrics.map(metric => {
      // If sample is too old to have evaluated the new metrics, give "N/A"
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
      let value = amrCountForNode ? amrCountForNode[metric.value] || "N/A" : 0;

      if (
        metric.value !== "coverage" &&
        metric.value !== "depth" &&
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        sampleForColumn.amrCounts.length > 0
      ) {
        // If sample is too old to have evaluated the new metrics,
        // change 0 to N/A
        // @ts-expect-error ts-migrate(2532) FIXME: Object is possibly 'undefined'.
        const newAMRDataCheck = sampleForColumn.amrCounts[0].rpm;
        if (
          value === 0 &&
          (newAMRDataCheck === null || newAMRDataCheck === undefined)
        ) {
          value = "N/A";
        }
      }

      return [
        metric.text,
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        metric.value === selectedOptions.metric ? <b>{value}</b> : value,
      ];
    });

    return [
      {
        name: "Info",
        data: [
          ["Sample", sampleName],
          ["Gene", gene],
          ["Allele", allele],
        ],
      },
      {
        name: "Values",
        data: values,
      },
    ];
  }

  getHeatmapLabels() {
    const { alleleLabels, geneLabels, selectedOptions } = this.props;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    switch (selectedOptions.viewLevel) {
      case VIEW_LEVEL_ALLELES: {
        return alleleLabels;
      }
      case VIEW_LEVEL_GENES: {
        return geneLabels;
      }
    }
  }

  // On "annotation_gene" vs "gene"
  // So it's kind of technical, but essentially there's kind
  // of a fuzzy line between a locus and an allele
  // and what gets named a gene. See the documentation
  // for more detail.

  findAMRCountForName(rowName: $TSFixMe, sample: $TSFixMe) {
    const { selectedOptions } = this.props;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    switch (selectedOptions.viewLevel) {
      case VIEW_LEVEL_ALLELES: {
        return sample.amrCounts.find(
          (amrCount: $TSFixMe) => amrCount["allele"] === rowName,
        );
      }
      case VIEW_LEVEL_GENES: {
        let amrCountForRow = sample.amrCounts.find(
          (amrCount: $TSFixMe) => amrCount["annotation_gene"] === rowName,
        );
        if (amrCountForRow === undefined) {
          amrCountForRow = sample.amrCounts.find(
            (amrCount: $TSFixMe) => amrCount["gene"] === rowName,
          );
        }
        return amrCountForRow;
      }
    }
  }

  computeHeatmapValues(rows: $TSFixMe) {
    const { selectedOptions, samplesWithAMRCounts } = this.props;
    const heatmapValues: $TSFixMe = [];
    rows.forEach((label: $TSFixMe) => {
      const rowValues: $TSFixMe = [];
      const rowName = label.label;
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      samplesWithAMRCounts.forEach(sample => {
        const amrCountForRow = this.findAMRCountForName(rowName, sample);
        if (amrCountForRow !== undefined) {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2538
          rowValues.push(amrCountForRow[selectedOptions.metric] || 0);
        } else {
          rowValues.push(0);
        }
      });
      heatmapValues.push(rowValues);
    });
    return heatmapValues;
  }

  updateHeatmap() {
    const { selectedOptions, sampleLabels } = this.props;
    const rows = this.getHeatmapLabels();
    const columns = sampleLabels;
    const values = this.computeHeatmapValues(rows);
    if (this.heatmap !== null) {
      this.heatmap.updateData({
        rowLabels: rows,
        columnLabels: columns,
        values: values,
      });
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      this.heatmap.updateScale(selectedOptions.scale);
    } else {
      this.initializeHeatmap(rows, columns, values);
    }
  }

  initializeHeatmap(rows: $TSFixMe, columns: $TSFixMe, values: $TSFixMe) {
    const { selectedOptions, onSampleLabelClick } = this.props;
    this.heatmap = new Heatmap(
      this.heatmapContainer,
      // Data for the Heatmap
      // The Heatmap expects values to be listed by rows, and rows and values are rendered in reverse order.
      // That is, the first array in "values" is rendered on the bottom; and the leftmost value is rendered
      // in the rightmost box, and vice versa.
      {
        rowLabels: rows,
        columnLabels: columns, // Each columnLabel object contains the sample name, id, and all metadata values
        values: values,
      },
      // Custom options:
      {
        // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
        scale: selectedOptions.scale,
        scaleMin: 0,
        customColorCallback: this.colorFilter,
        onNodeHover: this.onNodeHover,
        onNodeHoverOut: this.onNodeHoverOut,
        onColumnLabelClick: onSampleLabelClick,
        onRowLabelClick: this.onRowLabelClick,
        columnMetadata: this.getSelectedMetadataFields(), // gets the selected metadata *fields*
        onMetadataNodeHover: this.onMetadataNodeHover,
        onColumnMetadataLabelHover: this.onMetadataLabelHover,
        onColumnMetadataLabelOut: this.onMetadataLabelOut,
        onAddColumnMetadataClick: this.onMetadataAddButtonClick,
        marginLeft: 50, // our gene names are very short, so this is to prevent metadata names from disappearing
      },
    );
    this.heatmap.start();
  }

  // *** Callback functions for the heatmap ***

  colorFilter = (
    value: $TSFixMe,
    _node: $TSFixMe,
    originalColor: $TSFixMe,
    _colors: $TSFixMe,
    colorNoValue: $TSFixMe,
  ) => {
    // Leave zero values gray
    return value > 0 ? originalColor : colorNoValue;
  };

  onNodeHover = (node: $TSFixMe) => {
    this.setState({
      nodeHoverInfo: this.getTooltipData(node),
      nodeHovered: true,
      tooltipLocation: this.heatmap.getCursorLocation(),
    });
  };

  onNodeHoverOut = () => {
    this.setState({ nodeHoverInfo: null });
  };

  // mediate the callback function for clicking a row label in the heatmap,
  // so that clicking an allele returns the proper gene
  onRowLabelClick = (rowLabel: $TSFixMe) => {
    const { alleleToGeneMap, selectedOptions, onGeneLabelClick } = this.props;
    let geneName = rowLabel;
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
    if (selectedOptions.viewLevel === VIEW_LEVEL_ALLELES) {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
      geneName = alleleToGeneMap[rowLabel];
    }
    onGeneLabelClick(geneName);
  };

  onMetadataLabelHover = (node: $TSFixMe) => {
    const legend = this.heatmap.getColumnMetadataLegend(node.value);
    this.setState({
      columnMetadataLegend: legend,
      metadataLabelHovered: true,
      tooltipLocation: this.heatmap.getCursorLocation(),
    });
  };

  onMetadataNodeHover = (node: $TSFixMe, metadata: $TSFixMe) => {
    const legend = this.heatmap.getColumnMetadataLegend(metadata.value);
    const currentValue = node.metadata[metadata.value] || "Unknown";
    const currentPair = { [currentValue]: legend[currentValue] };
    this.setState({
      columnMetadataLegend: currentPair,
      tooltipLocation: this.heatmap.getCursorLocation(),
    });
  };

  onMetadataLabelOut = () => {
    this.setState({ columnMetadataLegend: null });
  };

  onMetadataAddButtonClick = (trigger: $TSFixMe) => {
    this.setState({
      addMetadataTrigger: trigger,
    });
  };

  onMetadataSelectionChange = (selectedMetadata: $TSFixMe) => {
    this.setState({
      selectedMetadata,
    });
  };

  // *** Following functions depend on state and must be called after the component has updated ***

  getSelectedMetadataFields() {
    const { samplesMetadataTypes } = this.props;
    const { selectedMetadata } = this.state;
    const sortByLabel = (a: $TSFixMe, b: $TSFixMe) =>
      a.label > b.label ? 1 : -1; // alphabetical

    return Array.from(selectedMetadata)
      .map(metadatum => {
        return {
          // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2532
          label: samplesMetadataTypes[metadatum].name,
          value: metadatum,
        };
      })
      .sort(sortByLabel);
  }

  // *** Render functions ***

  renderNodeHoverTooltip() {
    const { nodeHoverInfo, tooltipLocation } = this.state;
    if (!(nodeHoverInfo && tooltipLocation)) {
      return;
    }
    return (
      <div
        className={cx(cs.tooltip, nodeHoverInfo && cs.visible)}
        style={getTooltipStyle(tooltipLocation, {
          buffer: 20,
          below: true,
        })}
      >
        <TooltipVizTable data={nodeHoverInfo} />
      </div>
    );
  }

  render() {
    const {
      columnMetadataLegend,
      tooltipLocation,
      addMetadataTrigger,
      selectedMetadata,
    } = this.state;
    return (
      <div className={cs.AMRHeatmapVis}>
        <div
          className={cs.AMRHeatmapContainer}
          ref={container => {
            this.heatmapContainer = container;
          }}
        />
        {this.renderNodeHoverTooltip()}
        {columnMetadataLegend && tooltipLocation && (
          <MetadataLegend
            metadataColors={columnMetadataLegend}
            tooltipLocation={tooltipLocation}
          />
        )}
        {addMetadataTrigger && (
          <MetadataSelector
            addMetadataTrigger={addMetadataTrigger}
            selectedMetadata={selectedMetadata}
            metadataTypes={this.getMetadataTypes()}
            onMetadataSelectionChange={this.onMetadataSelectionChange}
            onMetadataSelectionClose={() => {
              this.setState({ addMetadataTrigger: null });
            }}
          />
        )}
      </div>
    );
  }
}
