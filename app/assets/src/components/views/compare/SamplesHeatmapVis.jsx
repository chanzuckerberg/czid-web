import React from "react";
import PropTypes from "prop-types";
import cx from "classnames";
import { keyBy } from "lodash/fp";
import { DataTooltip, ContextPlaceholder } from "~ui/containers";
import { SearchBoxList } from "~ui/controls";
import { openUrl } from "~utils/links";
import Heatmap from "~/components/visualizations/heatmap/Heatmap";
import cs from "./samples_heatmap_vis.scss";

class SamplesHeatmapVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      addMetadataTrigger: null,
      nodeHoverInfo: null,
      columnMetadataHoverNode: null,
      selectedMetadata: new Set(this.props.defaultMetadata)
    };

    this.heatmap = null;
    this.scale = this.props.scale;

    // TODO: yet another metric name conversion to remove
    this.metrics = [
      { key: "NT.aggregatescore", label: "Score" },
      { key: "NT.zscore", label: "NT Z Score" },
      { key: "NT.rpm", label: "NT rPM" },
      { key: "NT.r", label: "NT r (total reads)" },
      { key: "NR.zscore", label: "NR Z Score" },
      { key: "NR.rpm", label: "NR rPM" },
      { key: "NR.r", label: "NR r (total reads)" }
    ];

    this.metadataTypes = keyBy("key", this.props.metadataTypes);
  }

  componentDidMount() {
    this.heatmap = new Heatmap(
      this.heatmapContainer,
      {
        rowLabels: this.extractTaxonLabels(),
        columnLabels: this.extractSampleLabels(),
        values: this.props.data[this.props.metric]
      },
      {
        scale: this.props.scale,
        onNodeHover: this.handleNodeHover,
        onNodeHoverOut: this.handleNodeHoverOut,
        onNodeHoverMove: this.handleMouseHoverMove,
        onColumnMetadataLabelHover: this.handleColumnMetadataLabelHover,
        onColumnMetadataLabelOut: this.handleColumnMetadataLabelOut,
        onColumnMetadataLabelMove: this.handleMouseHoverMove,
        onRemoveRow: this.props.onRemoveTaxon,
        onColumnLabelClick: this.props.onSampleLabelClick,
        onCellClick: this.handleCellClick,
        onAddColumnMetadataClick: this.handleAddColumnMetadataClick,
        columnMetadata: this.getSelectedMetadata()
      }
    );
    this.heatmap.start();
  }

  componentDidUpdate() {
    if (this.props.scale !== this.scale) {
      this.scale = this.props.scale;
      this.heatmap.updateScale(this.props.scale);
    }
  }

  extractSampleLabels() {
    return this.props.sampleIds.map(id => {
      return {
        label: this.props.sampleDetails[id].name,
        metadata: this.props.sampleDetails[id].metadata
      };
    });
  }

  extractTaxonLabels() {
    return this.props.taxonIds.map(id => {
      return {
        label: this.props.taxonDetails[id].name
      };
    });
  }

  handleMouseHoverMove = (_, currentEvent) => {
    if (currentEvent) {
      this.setState({
        tooltipX: currentEvent.pageX,
        tooltipY: currentEvent.pageY
      });
    }
  };

  handleNodeHover = node => {
    this.setState({ nodeHoverInfo: this.getTooltipData(node) });
  };

  handleNodeHoverOut = () => {
    this.setState({ nodeHoverInfo: null });
  };

  handleColumnMetadataLabelHover = node => {
    this.setState({ columnMetadataHoverNode: node });
  };

  handleColumnMetadataLabelOut = () => {
    this.setState({ columnMetadataHoverNode: null });
  };

  download() {
    this.heatmap.download();
  }

  getTooltipData(node) {
    let sampleId = this.props.sampleIds[node.columnIndex];
    let taxonId = this.props.taxonIds[node.rowIndex];
    let sampleDetails = this.props.sampleDetails[sampleId];
    let taxonDetails = this.props.taxonDetails[taxonId];

    let nodeHasData = this.metrics.some(
      metric => !!this.props.data[metric.key][node.rowIndex][node.columnIndex]
    );

    let values = null;
    if (nodeHasData) {
      values = this.metrics.map(metric => {
        let data = this.props.data[metric.key];
        let value = (data[node.rowIndex][node.columnIndex] || 0).toFixed(0);
        return [
          metric.label,
          metric.key === this.props.metric ? <b>{value}</b> : value
        ];
      });
    }

    return [
      {
        name: "Info",
        data: [
          ["Sample", sampleDetails.name],
          ["Taxon", taxonDetails.name],
          ["Category", taxonDetails.category]
        ]
      },
      {
        name: "Values",
        data: nodeHasData ? values : [["", "Taxon not found in Sample"]]
      }
    ];
  }

  handleCellClick = (cell, currentEvent) => {
    openUrl(`/samples/${this.props.sampleIds[cell.columnIndex]}`, currentEvent);
  };

  handleAddColumnMetadataClick = trigger => {
    this.setState({
      addMetadataTrigger: trigger
    });
  };

  handleSelectedMetadataChange = selectedMetadata => {
    let intersection = new Set(
      [...this.state.selectedMetadata].filter(metadatum =>
        selectedMetadata.has(metadatum)
      )
    );
    this.setState(
      {
        selectedMetadata: new Set([...intersection, ...selectedMetadata])
      },
      () => {
        this.heatmap.updateColumnMetadata(this.getSelectedMetadata());
      }
    );
  };

  renderColumnMetadataSelector() {
    return (
      <div className={cs.metadataContainer}>
        <SearchBoxList
          options={this.getAvailableMetadataOptions()}
          onChange={this.handleSelectedMetadataChange}
          selected={this.state.selectedMetadata}
          title="Select Metadata Fields"
        />
      </div>
    );
  }

  renderColumnMetadataLegendRow(label, color) {
    return (
      <div className={cs.legendRow} key={label}>
        <span
          className={cs.legendEntryColor}
          style={{ backgroundColor: color }}
        />
        {label}
      </div>
    );
  }

  renderColumnMetadataLegend(node) {
    let legend = this.heatmap.getColumnMetadataLegend(node.value);
    return (
      <div className={cs.legend}>
        {Object.keys(legend).map(label =>
          this.renderColumnMetadataLegendRow(label, legend[label])
        )}
      </div>
    );
  }

  getSelectedMetadata() {
    return Array.from(this.state.selectedMetadata).map(metadatum => {
      return { value: metadatum, label: this.metadataTypes[metadatum].name };
    });
  }

  getAvailableMetadataOptions() {
    return this.props.metadataTypes.map(metadata => {
      return { value: metadata.key, label: metadata.name };
    });
  }

  render() {
    return (
      <div className={cs.samplesHeatmapVis}>
        <div
          className={cs.heatmapContainer}
          ref={container => {
            this.heatmapContainer = container;
          }}
        />

        {this.state.nodeHoverInfo && (
          <div
            className={cx(cs.tooltip, this.state.nodeHoverInfo && cs.visible)}
            style={{
              left: `${this.state.tooltipX + 20}px`,
              top: `${this.state.tooltipY + 20}px`
            }}
          >
            <DataTooltip data={this.state.nodeHoverInfo} />
          </div>
        )}
        {this.state.columnMetadataHoverNode && (
          <div
            className={cx(
              cs.tooltip,
              this.state.columnMetadataHoverNode && cs.visible
            )}
            style={{
              left: `${this.state.tooltipX + 20}px`,
              top: `${this.state.tooltipY + 20}px`
            }}
          >
            {this.renderColumnMetadataLegend(
              this.state.columnMetadataHoverNode
            )}
          </div>
        )}
        {this.state.addMetadataTrigger && (
          <ContextPlaceholder
            closeOnOutsideClick
            context={this.state.addMetadataTrigger}
            horizontalOffset={5}
            verticalOffset={10}
            onClose={() => {
              this.setState({ addMetadataTrigger: null });
            }}
            position="bottom center"
          >
            {this.renderColumnMetadataSelector()}
          </ContextPlaceholder>
        )}
      </div>
    );
  }
}

SamplesHeatmapVis.defaultProps = {
  defaultMetadata: ["collection_location"]
};

SamplesHeatmapVis.propTypes = {
  data: PropTypes.object,
  defaultMetadata: PropTypes.array,
  metadataTypes: PropTypes.array,
  metric: PropTypes.string,
  onRemoveTaxon: PropTypes.func,
  onSampleLabelClick: PropTypes.func,
  sampleDetails: PropTypes.object,
  sampleIds: PropTypes.array,
  scale: PropTypes.string,
  taxonDetails: PropTypes.object,
  taxonIds: PropTypes.array
};

export default SamplesHeatmapVis;
