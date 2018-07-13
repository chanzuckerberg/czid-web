import React from "react";
import Slider from "rc-slider";

class LabeledSlider extends React.Component {
  render() {
    return (
      <div className="labeled-slider">
        <span className="title">
          <b>{this.props.label}</b> {this.props.defaultValue}
        </span>
        <Slider {...this.props} />
      </div>
    );
  }
}

export default LabeledSlider;
