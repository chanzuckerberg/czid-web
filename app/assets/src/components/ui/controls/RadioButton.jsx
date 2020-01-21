import React from "react";
import cs from "./radio_button.scss";
import cx from "classnames";
import PropTypes from "prop-types";

class RadioButton extends React.Component {
  render() {
    return (
      <div
        className={cx(
          cs.radioButton,
          this.props.className,
          this.props.selected && cs.selected,
          this.props.disabled && cs.disabled
        )}
        onClick={this.props.disabled ? undefined : this.props.onClick}
      />
    );
  }
}

RadioButton.propTypes = {
  selected: PropTypes.bool,
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  className: PropTypes.string,
};

export default RadioButton;
