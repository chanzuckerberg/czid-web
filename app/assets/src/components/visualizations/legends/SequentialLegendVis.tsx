import React from "react";
import SequentialLegend from "./SequentialLegend";

interface SequentialLegendVisProps {
  max?: number;
  min?: number;
  scale?: string;
}

class SequentialLegendVis extends React.Component<SequentialLegendVisProps> {
  legend: $TSFixMe;
  legendContainer: $TSFixMe;
  constructor(props: SequentialLegendVisProps) {
    super(props);
    this.legend = null;
  }

  componentDidMount() {
    this.legend = new SequentialLegend(this.legendContainer, {
      scale: this.props.scale,
      min: this.props.min,
      max: this.props.max,
    });
    this.legend.update();
  }

  componentDidUpdate() {
    this.legend.updateOptions({
      scale: this.props.scale,
      min: this.props.min,
      max: this.props.max,
    });
    this.legend.update();
  }

  render() {
    return (
      <div>
        <div
          ref={container => {
            this.legendContainer = container;
          }}
        />
      </div>
    );
  }
}

export default SequentialLegendVis;
