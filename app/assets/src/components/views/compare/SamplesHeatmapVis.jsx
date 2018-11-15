import DataTooltip from "../../ui/containers/DataTooltip";
import Heatmap from "../../visualizations/heatmap/Heatmap";
import PropTypes from "prop-types";
import React from "react";
import { openUrl } from "../../utils/links";

class SamplesHeatmapVis extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      nodeHover: null
    };

    this.heatmap = null;
    this.scale = this.props.scale;

    this.handleNodeHover = this.handleNodeHover.bind(this);

    // TODO: yet another metric name conversion to remove
    this.metricLabels = {
      "NT.aggregatescore": "Score",
      "NT.zscore": "NT Z Score",
      "NT.rpm": "NT rPM",
      "NT.r": "NT r (total reads)",
      "NR.zscore": "NR Z Score",
      "NR.rpm": "NR rPM",
      "NR.r": "NR r (total reads)"
    };

    this.handleSampleLabelClick = this.handleSampleLabelClick.bind(this);
    this.handleCellClick = this.handleCellClick.bind(this);
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
        tooltipContainer: this.tooltipContainer,
        onNodeHover: this.handleNodeHover,
        onRemoveRow: this.props.onRemoveTaxon,
        onColumnLabelClick: this.handleSampleLabelClick,
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

  handleNodeHover(node) {
    this.setState({ nodeHover: node });
  }

  getTooltipData() {
    let node = this.state.nodeHover;
    let sampleId = this.props.sampleIds[node.columnIndex];
    let taxonId = this.props.taxonIds[node.rowIndex];
    let sampleDetails = this.props.sampleDetails[sampleId];
    let taxonDetails = this.props.taxonDetails[taxonId];
    let values = Object.keys(this.props.data)
      .filter(
        metric => this.props.data[metric][node.rowIndex][node.columnIndex]
      )
      .map(metric => {
        let data = this.props.data[metric];
        let value = data[node.rowIndex][node.columnIndex].toFixed(0);
        return [
          this.metricLabels[metric],
          metric === this.props.metric ? <b>{value}</b> : value
        ];
      });

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
        data: values.length ? values : [["", "Taxon not found in Sample"]]
      }
    ];
  }

  handleSampleLabelClick(sampleName, event) {
    openUrl(`/samples/${this.props.sampleDetails[sampleName].id}`, event);
  }

  handleCellClick(cell) {
    openUrl(`/samples/${this.props.sampleIds[cell.columnIndex]}`, event);
  }

  render() {
    return (
      <div className="samples-heatmap-vis">
        <div
          className="samples-heatmap-vis__container"
          ref={container => {
            this.heatmapContainer = container;
          }}
        />
        <div
          className="samples-heatmap-vis__tooltip"
          ref={tooltip => {
            this.tooltipContainer = tooltip;
          }}
        >
          {this.state.nodeHover && <DataTooltip data={this.getTooltipData()} />}
        </div>
      </div>
    );
  }
}

SamplesHeatmapVis.propTypes = {
  data: PropTypes.object,
  metric: PropTypes.string,
  onRemoveTaxon: PropTypes.func,
  sampleDetails: PropTypes.object,
  sampleIds: PropTypes.array,
  scale: PropTypes.func,
  taxonDetails: PropTypes.object,
  taxonIds: PropTypes.array
};

export default SamplesHeatmapVis;
