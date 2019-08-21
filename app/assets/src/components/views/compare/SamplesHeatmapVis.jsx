import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { size, map, keyBy } from "lodash/fp";

import { withAnalytics, logAnalyticsEvent } from "~/api/analytics";
import { DataTooltip } from "~ui/containers";
import { openUrl } from "~utils/links";
import Heatmap from "~/components/visualizations/heatmap/Heatmap";
import { getTooltipStyle } from "~/components/utils/tooltip";
import MetadataLegend from "~/components/common/Heatmap/MetadataLegend";
import MetadataSelector from "~/components/common/Heatmap/MetadataSelector";
import { splitIntoMultipleLines } from "~/helpers/strings";
import AlertIcon from "~ui/icons/AlertIcon";
import PlusMinusControl from "~/components/ui/controls/PlusMinusControl";

import cs from "./samples_heatmap_vis.scss";

const CAPTION_LINE_WIDTH = 180;

class SamplesHeatmapVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      addMetadataTrigger: null,
      nodeHoverInfo: null,
      columnMetadataLegend: null,
      selectedMetadata: new Set(this.props.defaultMetadata),
      tooltipLocation: null,
      zoom: null,
    };

    this.heatmap = null;
    this.scale = this.props.scale;

    // TODO: yet another metric name conversion to remove
    this.metrics = [
      { key: "NT.zscore", label: "NT Z Score" },
      { key: "NT.rpm", label: "NT rPM" },
      { key: "NT.r", label: "NT r (total reads)" },
      { key: "NR.zscore", label: "NR Z Score" },
      { key: "NR.rpm", label: "NR rPM" },
      { key: "NR.r", label: "NR r (total reads)" },
    ];

    this.metadataTypes = keyBy("key", this.props.metadataTypes);
  }

  componentDidMount() {
    const {
      onMetadataSortChange,
      metadataSortField,
      metadataSortAsc,
    } = this.props;

    this.heatmap = new Heatmap(
      this.heatmapContainer,
      {
        rowLabels: this.extractTaxonLabels(),
        columnLabels: this.extractSampleLabels(), // Also includes column metadata.
        values: this.props.data[this.props.metric],
      },
      {
        customColorCallback: this.colorScale,
        columnMetadata: this.getSelectedMetadata(),
        initialColumnMetadataSortField: metadataSortField,
        initialColumnMetadataSortAsc: metadataSortAsc,
        onNodeHover: this.handleNodeHover,
        onMetadataNodeHover: this.handleMetadataNodeHover,
        onNodeHoverMove: this.handleMouseHoverMove,
        onNodeHoverOut: this.handleNodeHoverOut,
        onColumnMetadataSortChange: onMetadataSortChange,
        onColumnMetadataLabelHover: this.handleColumnMetadataLabelHover,
        onColumnMetadataLabelMove: this.handleMouseHoverMove,
        onColumnMetadataLabelOut: this.handleColumnMetadataLabelOut,
        onRemoveRow: this.props.onRemoveTaxon,
        onCellClick: this.handleCellClick,
        onColumnLabelClick: this.props.onSampleLabelClick,
        onRowLabelClick: this.props.onTaxonLabelClick,
        onAddColumnMetadataClick: this.handleAddColumnMetadataClick,
        scale: this.props.scale,
        // only display colors to positive values
        scaleMin: 0,
        printCaption: this.generateHeatmapCaptions(),
        shouldSortColumns: this.props.sampleSortType === "alpha", // else cluster
      }
    );
    this.heatmap.start();
  }

  componentDidUpdate(prevProps) {
    if (this.props.scale !== this.scale) {
      this.scale = this.props.scale;
      this.heatmap.updateScale(this.props.scale);
    }
    if (this.props.sampleDetails !== prevProps.sampleDetails) {
      this.heatmap.updateData({
        columnLabels: this.extractSampleLabels(), // Also includes column metadata.
      });
    }
    if (this.props.thresholdFilters !== prevProps.thresholdFilters) {
      this.heatmap.updatePrintCaption(this.generateHeatmapCaptions());
    }
    if (this.props.sampleSortType !== prevProps.sampleSortType) {
      this.heatmap.updateSortColumns(this.props.sampleSortType === "alpha");
    }
  }

  extractSampleLabels() {
    return this.props.sampleIds.map(id => {
      return {
        label: this.props.sampleDetails[id].name,
        metadata: this.props.sampleDetails[id].metadata,
        id,
      };
    });
  }

  colorScale = (value, node, originalColor, _, colorNoValue) => {
    const { taxonFilterState } = this.props;
    const filtered = taxonFilterState[node.rowIndex][node.columnIndex];
    return value > 0 && filtered ? originalColor : colorNoValue;
  };

  extractTaxonLabels() {
    return this.props.taxonIds.map(id => {
      return {
        label: this.props.taxonDetails[id].name,
      };
    });
  }

  generateHeatmapCaptions = () => {
    const { thresholdFilters } = this.props;

    const numFilters = size(thresholdFilters);

    if (numFilters == 0) {
      return [];
    }

    const filterStrings = map(
      filter => `${filter.metricDisplay} ${filter.operator} ${filter.value}`,
      thresholdFilters
    );

    const fullString = `${numFilters} filter${
      numFilters > 1 ? "s were" : " was"
    } applied to the above heatmap: ${filterStrings.join(", ")}.
      Non-conforming cells have been hidden or grayed out.`;

    return splitIntoMultipleLines(fullString, CAPTION_LINE_WIDTH);
  };

  handleMouseHoverMove = (_, currentEvent) => {
    if (currentEvent) {
      this.setState({
        tooltipLocation: {
          left: currentEvent.pageX,
          top: currentEvent.pageY,
        },
      });
    }
  };

  handleNodeHover = node => {
    this.setState({ nodeHoverInfo: this.getTooltipData(node) });
    logAnalyticsEvent("SamplesHeatmapVis_node_hovered", {
      nodeValue: node.value,
      nodeId: node.id,
    });
  };

  handleMetadataNodeHover = (node, metadata) => {
    const legend = this.heatmap.getColumnMetadataLegend(metadata.value);
    const currentValue = node.metadata[metadata.value] || "Unknown";
    const currentPair = { [currentValue]: legend[currentValue] };
    this.setState({
      columnMetadataLegend: currentPair,
    });
    logAnalyticsEvent("SamplesHeatmapVis_metadata-node_hovered", metadata);
  };

  handleNodeHoverOut = () => {
    this.setState({ nodeHoverInfo: null });
  };

  handleColumnMetadataLabelHover = node => {
    const legend = this.heatmap.getColumnMetadataLegend(node.value);
    this.setState({
      columnMetadataLegend: legend,
    });
    logAnalyticsEvent("SamplesHeatmapVis_column-metadata_hovered", {
      nodeValue: node.value,
      columnMetadataLegend: legend,
    });
  };

  handleColumnMetadataLabelOut = () => {
    this.setState({ columnMetadataLegend: null });
  };

  download() {
    this.heatmap.download();
  }

  downloadAsPng() {
    this.heatmap.downloadAsPng();
  }

  getTooltipData(node) {
    const { data, taxonFilterState, sampleIds, taxonIds } = this.props;
    let sampleId = sampleIds[node.columnIndex];
    let taxonId = taxonIds[node.rowIndex];
    let sampleDetails = this.props.sampleDetails[sampleId];
    let taxonDetails = this.props.taxonDetails[taxonId];

    let nodeHasData = this.metrics.some(
      metric => !!data[metric.key][node.rowIndex][node.columnIndex]
    );

    const isFiltered = taxonFilterState[node.rowIndex][node.columnIndex];

    let values = null;
    if (nodeHasData) {
      values = this.metrics.map(metric => {
        const data = this.props.data[metric.key];
        const value = parseFloat(
          (data[node.rowIndex][node.columnIndex] || 0).toFixed(4)
        );
        return [
          metric.label,
          metric.key === this.props.metric ? <b>{value}</b> : value,
        ];
      });
    }

    let subtitle = null;

    if (!nodeHasData) {
      subtitle = "This taxon was not found in the sample.";
    } else if (!isFiltered) {
      subtitle = "This taxon does not satisfy the threshold filters.";
    }

    if (subtitle) {
      subtitle = (
        <div className={cs.warning}>
          <AlertIcon className={cs.warningIcon} />
          <div className={cs.warningText}>{subtitle}</div>
        </div>
      );
    }

    const sections = [
      {
        name: "Info",
        data: [
          ["Sample", sampleDetails.name],
          ["Taxon", taxonDetails.name],
          ["Category", taxonDetails.category],
        ],
        disabled: !isFiltered,
      },
    ];

    if (nodeHasData) {
      sections.push({
        name: "Values",
        data: values,
        disabled: !isFiltered,
      });
    }

    return {
      subtitle,
      data: sections,
    };
  }

  handleCellClick = (cell, currentEvent) => {
    const sampleId = this.props.sampleIds[cell.columnIndex];
    openUrl(`/samples/${sampleId}`, currentEvent);
    logAnalyticsEvent("SamplesHeatmapVis_cell_clicked", {
      sampleId,
    });
  };

  handleAddColumnMetadataClick = trigger => {
    this.setState({
      addMetadataTrigger: trigger,
    });
    logAnalyticsEvent("SamplesHeatmapVis_column-metadata_clicked", {
      addMetadataTrigger: trigger,
    });
  };

  handleSelectedMetadataChange = selectedMetadata => {
    const { onMetadataChange } = this.props;

    let intersection = new Set(
      [...this.state.selectedMetadata].filter(metadatum =>
        selectedMetadata.has(metadatum)
      )
    );
    const current = new Set([...intersection, ...selectedMetadata]);
    this.setState(
      {
        selectedMetadata: current,
      },
      () => {
        this.heatmap.updateColumnMetadata(this.getSelectedMetadata());
        onMetadataChange && onMetadataChange(selectedMetadata);
        logAnalyticsEvent("SamplesHeatmapVis_selected-metadata_changed", {
          selectedMetadata: current.length,
        });
      }
    );
  };

  getSelectedMetadata() {
    const sortByLabel = (a, b) => (a.label > b.label ? 1 : -1);

    return Array.from(this.state.selectedMetadata)
      .filter(metadatum => !!this.metadataTypes[metadatum])
      .map(metadatum => {
        return { value: metadatum, label: this.metadataTypes[metadatum].name };
      })
      .sort(sortByLabel);
  }

  getAvailableMetadataOptions() {
    return this.props.metadataTypes.map(metadata => {
      return { value: metadata.key, label: metadata.name };
    });
  }

  handleZoom(direction) {
    this.setState({ zoom: direction });
  }

  getZoomStyle() {
    const zoom = this.state.zoom;
    if (zoom === null) {
      return 1.0;
    } else if (zoom === "in") {
      return 1.5;
    } else if (zoom === "out") {
      return 0.5;
    }
  }

  render() {
    const {
      tooltipLocation,
      nodeHoverInfo,
      columnMetadataLegend,
      addMetadataTrigger,
      selectedMetadata,
    } = this.state;
    return (
      <div className={cs.samplesHeatmapVis}>
        <PlusMinusControl
          onPlusClick={withAnalytics(
            this.handleZoom("in"),
            "SamplesHeatmapVis_zoom-in-control_clicked"
          )}
          onMinusClick={withAnalytics(
            this.handleZoom("out"),
            "SamplesHeatmapVis_zoom-out-control_clicked"
          )}
          className={cs.plusMinusControl}
        />
        <div
          className={cs.heatmapContainer}
          style={{ zoom: this.getZoomStyle() }}
          ref={container => {
            this.heatmapContainer = container;
          }}
        />
        {nodeHoverInfo &&
          tooltipLocation && (
            <div
              className={cx(cs.tooltip, nodeHoverInfo && cs.visible)}
              style={getTooltipStyle(tooltipLocation, {
                buffer: 20,
                below: true,
              })}
            >
              <DataTooltip {...nodeHoverInfo} />
            </div>
          )}
        {columnMetadataLegend &&
          tooltipLocation && (
            <MetadataLegend
              metadataColors={columnMetadataLegend}
              tooltipLocation={tooltipLocation}
            />
          )}
        {addMetadataTrigger && (
          <MetadataSelector
            addMetadataTrigger={addMetadataTrigger}
            selectedMetadata={selectedMetadata}
            metadataTypes={this.getAvailableMetadataOptions()}
            onMetadataSelectionChange={this.handleSelectedMetadataChange}
            onMetadataSelectionClose={() => {
              this.setState({ addMetadataTrigger: null });
            }}
          />
        )}
      </div>
    );
  }
}

SamplesHeatmapVis.defaultProps = {
  defaultMetadata: [],
};

SamplesHeatmapVis.propTypes = {
  data: PropTypes.object,
  taxonFilterState: PropTypes.objectOf(PropTypes.objectOf(PropTypes.bool)),
  defaultMetadata: PropTypes.array,
  metadataTypes: PropTypes.array,
  metric: PropTypes.string,
  metadataSortField: PropTypes.string,
  metadataSortAsc: PropTypes.bool,
  onMetadataSortChange: PropTypes.func,
  onMetadataChange: PropTypes.func,
  onRemoveTaxon: PropTypes.func,
  onSampleLabelClick: PropTypes.func,
  onTaxonLabelClick: PropTypes.func,
  sampleDetails: PropTypes.object,
  sampleIds: PropTypes.array,
  scale: PropTypes.string,
  taxonDetails: PropTypes.object,
  taxonIds: PropTypes.array,
  thresholdFilters: PropTypes.any,
  sampleSortType: PropTypes.string,
};

export default SamplesHeatmapVis;
