import PropTypes from "prop-types";
import React from "react";
import Slider from "rc-slider";

class LabeledSlider extends React.Component {
  constructor(props) {
    super(props);
    this.onChangeParent = this.props.onChange;

    this.state = {
      value: this.props.value
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(newValue) {
    this.setState({ value: newValue });
    if (typeof this.onChangeParent == "function") {
      this.onChangeParent();
    }
  }

  render() {
    return (
      <div className="labeled-slider">
        <span className="title">
          <b>{this.props.label}</b> {this.state.value}
        </span>
        <Slider
          {...this.props}
          value={this.state.value}
          onChange={this.onChange}
        />
      </div>
    );
  }
}

LabeledSlider.propTypes = {
  label: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.number
};

export default LabeledSlider;
