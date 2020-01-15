import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { size, map, keyBy, isEmpty } from "lodash/fp";

import { withAnalytics, logAnalyticsEvent } from "~/api/analytics";
import { DataTooltip } from "~ui/containers";
import { openUrlInNewTab } from "~utils/links";
import Heatmap from "~/components/visualizations/heatmap/Heatmap";
import { getTooltipStyle } from "~/components/utils/tooltip";
import MetadataLegend from "~/components/common/Heatmap/MetadataLegend";
import RowGroupLegend from "~/components/common/Heatmap/RowGroupLegend";
import MetadataSelector from "~/components/common/Heatmap/MetadataSelector";
import { splitIntoMultipleLines } from "~/helpers/strings";
import AlertIcon from "~ui/icons/AlertIcon";
import PlusMinusControl from "~/components/ui/controls/PlusMinusControl";
import RemoveIcon from "~ui/icons/RemoveIcon";

import cs from "./samples_heatmap_vis.scss";

const CAPTION_LINE_WIDTH = 180;

class SamplesHeatmapVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      addMetadataTrigger: null,
      nodeHoverInfo: null,
      columnMetadataLegend: null,
      rowGroupLegend: null,
      selectedMetadata: new Set(this.props.defaultMetadata),
      tooltipLocation: null,
      displayControlsBanner: true,
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
        onRowGroupEnter: this.handleRowGroupEnter,
        onRowGroupLeave: this.handleRowGroupLeave,
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
        shouldSortRows: this.props.taxaSortType === "genus", // else cluster
        // Shrink to fit the viewport width
        maxWidth: this.heatmapContainer.offsetWidth,
      }
    );
    this.heatmap.start();

    document.addEventListener("keydown", this.handleKeyDown, false);
    document.addEventListener("keyup", this.handleKeyUp, false);
  }

  componentWillUnmount() {
    document.removeEventListener("keydown", this.handleKeyDown, false);
    document.removeEventListener("keyup", this.handleKeyUp, false);
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
    if (this.props.taxaSortType !== prevProps.taxaSortType) {
      this.heatmap.updateSortRows(this.props.taxaSortType === "genus");
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
      const taxon = this.props.taxonDetails[id];
      const sortKey =
        taxon.parentId == -200 // MISSING_GENUS_ID
          ? Number.MAX_SAFE_INTEGER
          : taxon.parentId; // parentId is false when taxon level is genus
      return {
        label: taxon.name,
        sortKey: sortKey,
        genusName: taxon.genusName,
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
    // Disable tooltip if currently spacebar is pressed to pan the heatmap.
    if (this.state.spacePressed) {
      this.setState({
        tooltipLocation: null,
        nodeHoverInfo: null,
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

  handleRowGroupEnter = (rowGroup, rect, minTop) => {
    this.setState({
      rowGroupLegend: {
        label: `Genus: ${rowGroup.genusName || "Unknown"}`,
        tooltipLocation: {
          left: rect.left + rect.width / 2,
          top: Math.max(minTop, rect.top),
        },
      },
    });
    logAnalyticsEvent("SamplesHeatmapVis_row-group_hovered", {
      genusName: rowGroup.genusName,
      genusId: rowGroup.sortKey,
    });
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

  handleRowGroupLeave = () => {
    this.setState({ rowGroupLegend: null });
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
      nodeHasData,
    };
  }

  handleKeyDown = currentEvent => {
    if (currentEvent.code === "Space") {
      this.setState({ spacePressed: true });
    }
  };

  handleKeyUp = currentEvent => {
    if (currentEvent.code === "Space") {
      this.setState({ spacePressed: false });
      currentEvent.preventDefault();
    }
  };

  handleCellClick = (cell, currentEvent) => {
    // Disable cell click if spacebar is pressed to pan the heatmap.
    if (!this.state.spacePressed) {
      const sampleId = this.props.sampleIds[cell.columnIndex];
      openUrlInNewTab(`/samples/${sampleId}`, currentEvent);
      logAnalyticsEvent("SamplesHeatmapVis_cell_clicked", {
        sampleId,
      });
    }
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

  handleZoom(increment) {
    const newZoom = Math.min(
      3, // max zoom factor
      Math.max(0.2, this.heatmap.options.zoom + increment)
    );
    this.heatmap.updateZoom(newZoom);
  }

  hideControlsBanner = () => {
    this.setState({ displayControlsBanner: false });
  };

  render() {
    const {
      tooltipLocation,
      nodeHoverInfo,
      columnMetadataLegend,
      rowGroupLegend,
      addMetadataTrigger,
      selectedMetadata,
    } = this.state;
    return (
      <div className={cs.samplesHeatmapVis}>
        <PlusMinusControl
          onPlusClick={withAnalytics(
            () => this.handleZoom(0.25),
            "SamplesHeatmapVis_zoom-in-control_clicked"
          )}
          onMinusClick={withAnalytics(
            () => this.handleZoom(-0.25),
            "SamplesHeatmapVis_zoom-out-control_clicked"
          )}
          className={cs.plusMinusControl}
        />
        <div
          className={cx(
            cs.heatmapContainer,
            (!isEmpty(this.props.thresholdFilters) ||
              !isEmpty(this.props.taxonCategories)) &&
              cs.filtersApplied,
            this.props.fullScreen && cs.fullScreen
          )}
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
                // so we can show the tooltip above the cursor if need be
                height: nodeHoverInfo.nodeHasData ? 300 : 180,
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
        {rowGroupLegend && <RowGroupLegend {...rowGroupLegend} />}
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
        <div
          className={cx(
            cs.bannerContainer,
            this.state.displayControlsBanner ? cs.show : cs.hide
          )}
        >
          <div className={cs.bannerText}>
            Hold SHIFT to scroll horizontally and SPACE BAR to pan.
            <RemoveIcon
              className={cs.removeIcon}
              onClick={this.hideControlsBanner}
            />
          </div>
        </div>
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
  taxonCategories: PropTypes.array,
  taxonDetails: PropTypes.object,
  taxonIds: PropTypes.array,
  thresholdFilters: PropTypes.any,
  sampleSortType: PropTypes.string,
  fullScreen: PropTypes.bool,
  taxaSortType: PropTypes.string,
};

export default SamplesHeatmapVis;
