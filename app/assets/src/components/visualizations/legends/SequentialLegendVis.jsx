import React from "react";
import SequentialLegend from "./SequentialLegend";

class SequentialLegendVis extends React.Component {
  constructor(props) {
    super(props);
    this.legend = null;
  }

  componentDidMount() {
    this.legend = new SequentialLegend(this.legendContainer, {
      scale: this.props.scale,
      min: this.props.min,
      max: this.props.max
    });
    this.legend.update();
  }

  componentDidUpdate() {}

  render() {
    return (
      <div className="sequential-legend-vis">
        <div
          className="sequential-legend__container"
          ref={container => {
            this.legendContainer = container;
          }}
        />
      </div>
    );
  }
}

export default SequentialLegendVis;
