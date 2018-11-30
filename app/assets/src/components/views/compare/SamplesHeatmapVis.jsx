import DataTooltip from "../../ui/containers/DataTooltip";
import Heatmap from "../../visualizations/heatmap/Heatmap";
import PropTypes from "prop-types";
import React from "react";
import { openUrl } from "../../utils/links";
import cs from "./samples_heatmap_vis.scss";
import cx from "classnames";

class SamplesHeatmapVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      nodeHoverInfo: null
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
        onNodeHoverMove: this.handleNodeHoverMove,
        onRemoveRow: this.props.onRemoveTaxon,
        onColumnLabelClick: this.props.onSampleLabelClick,
        onCellClick: this.handleCellClick
      }
    );
  }

  componentDidUpdate() {
    if (this.props.scale !== this.scale) {
      this.scale = this.props.scale;
      this.heatmap.updateScale(this.props.scale);
    }
  }

  extractSampleLabels() {
    return this.props.sampleIds.map(id => this.props.sampleDetails[id].name);
  }

  extractTaxonLabels() {
    return this.props.taxonIds.map(id => this.props.taxonDetails[id].name);
  }

  handleNodeHover = node => {
    this.setState({ nodeHoverInfo: this.getTooltipData(node) });
  };

  handleNodeHoverMove = (_, currentEvent) => {
    if (currentEvent) {
      this.setState({
        tooltipX: currentEvent.pageX,
        tooltipY: currentEvent.pageY
      });
    }
  };

  handleNodeHoverOut = () => {
    this.setState({ nodeHoverInfo: null });
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
      </div>
    );
  }
}

SamplesHeatmapVis.propTypes = {
  data: PropTypes.object,
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
