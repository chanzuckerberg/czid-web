import cx from "classnames";
import React from "react";
import cs from "./radio_button.scss";

interface RadioButtonProps {
  selected?: boolean;
  disabled?: boolean;
  onClick?: $TSFixMeFunction;
  className?: string;
}

class RadioButton extends React.Component<RadioButtonProps> {
  render() {
    return (
      <div
        className={cx(
          cs.radioButton,
          this.props.className,
          this.props.selected && cs.selected,
          this.props.disabled && cs.disabled,
        )}
        onClick={this.props.disabled ? undefined : this.props.onClick}
      />
    );
  }
}

export default RadioButton;
