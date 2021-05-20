import PropTypes from "prop-types";
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

SequentialLegendVis.propTypes = {
  max: PropTypes.number,
  min: PropTypes.number,
  scale: PropTypes.string,
};

export default SequentialLegendVis;
