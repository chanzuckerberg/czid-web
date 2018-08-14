import PropTypes from "prop-types";
import React from "react";
import BaseSlider from "rc-slider";

class Slider extends React.Component {
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
    const sliderClasses = `idseq-ui slider ${
      this.props.disabled ? "disabled" : " "
    }`;

    return (
      <div className={sliderClasses}>
        <span className="label-title">{this.props.label}</span>
        {this.state.value}
        <BaseSlider
          {...this.props}
          value={this.state.value}
          onChange={this.onChange}
        />
      </div>
    );
  }
}

Slider.propTypes = {
  disabled: PropTypes.bool,
  label: PropTypes.string,
  onChange: PropTypes.func,
  value: PropTypes.number
};

export default Slider;
