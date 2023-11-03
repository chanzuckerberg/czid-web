import BaseSlider from "rc-slider";
import React from "react";

interface SliderProps {
  disabled?: boolean;
  label?: string;
  onChange?: $TSFixMeFunction;
  options?: $TSFixMe;
  onAfterChange: $TSFixMeFunction;
  min: number;
  max: number;
  value?: number;
}

interface SliderState {
  value: number;
}

class Slider extends React.Component<SliderProps, SliderState> {
  onChangeParent: $TSFixMeFunction;
  constructor(props) {
    super(props);
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
    this.onChangeParent = this.props.onChange;

    this.state = {
      // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2322
      value: this.props.value,
    };

    this.onChange = this.onChange.bind(this);
  }

  onChange(newValue) {
    this.setState({ value: newValue });
    if (typeof this.onChangeParent === "function") {
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

export default Slider;
