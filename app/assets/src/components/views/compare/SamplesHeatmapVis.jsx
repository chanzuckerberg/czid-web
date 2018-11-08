import React from "react";
import Heatmap from "../../visualizations/heatmap/NewHeatmap";

class SamplesHeatmapVis extends React.Component {
  constructor(props) {
    super(props);

    this.heatmap = null;
  }

  componentDidMount() {
    console.log(this.props);
    this.heatmap = new Heatmap(this.heatmapContainer, {
      rowLabels: this.extractTaxonLabels(),
      columnLabels: this.extractSampleLabels(),
      values: this.props.data[this.props.metric]
    });
    this.heatmap.update();
  }

  extractSampleLabels() {
    return this.props.sampleIds.map(id => this.props.sampleDetails[id].name);
  }

  extractTaxonLabels() {
    return this.props.taxonIds.map(id => this.props.taxonDetails[id].name);
  }

  renderHeatmap() {
    <div>Heatmap goes here...</div>;
    // return <Heatmap
    //   colTree={this.clusteredSamples.tree}
    //   rowTree={this.clusteredTaxons.tree}
    //   rows={this.state.taxons.names.length}
    //   columns={this.state.data.length}
    //   getRowLabel={this.getRowLabel}
    //   getColumnLabel={this.getColumnLabel}
    //   getCellValue={this.dataGetters[this.state.selectedOptions.metric]}
    //   getTooltip={this.getTooltip}
    //   onCellClick={this.onCellClick}
    //   onColumnLabelClick={this.onSampleLabelClick}
    //   onRemoveRow={this.onRemoveRow}
    //   scale={this.state.availableOptions.scales[scaleIndex][1]}
    //   colors={this.colors}
    //   />
  }

  render() {
    console.log("render heatmap");
    return (
      <div className="samples-heatmap-vis">
        <div
          className="samples-heatmap-vis__container"
          ref={container => {
            this.heatmapContainer = container;
          }}
        />
        {/* <div
          className="samples-heatmap-vis__tooltip"
          ref={tooltip => {
            this.treeToheatoltip = tooltip;
          }}
        >
          {this.renderTooltip()}
        </div> */}
      </div>
    );
  }
}

export default SamplesHeatmapVis;
