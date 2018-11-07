import React from "react";

class SamplesHeatmapVis extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <div className="samples-heatmap-vis">
        <div
          className="samples-heatmap-vis__container"
          ref={container => {
            this.treeContainer = container;
          }}
        />
        <div
          className="samples-heatmap-vis__tooltip"
          ref={tooltip => {
            this.treeTooltip = tooltip;
          }}
        >
          {this.renderTooltip()}
        </div>
      </div>
    );
  }
}

export default SamplesHeatmapVis;
