import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import PropTypes from "prop-types";
import React from "react";
import cx from "classnames";
import cs from "./button_dropdown.scss";

class ButtonDropdown extends React.Component {
  getButton() {
    if (this.props.primary) {
      return (
        <PrimaryButton
          text={this.props.text}
          disabled={this.props.disabled}
          icon={this.props.icon}
          className={cs.button}
          hasDropdownArrow
        />
      );
    } else {
      return (
        <SecondaryButton
          text={this.props.text}
          disabled={this.props.disabled}
          icon={this.props.icon}
          className={cs.button}
          hasDropdownArrow
        />
      );
    }
  }

  render() {
    return (
      <BareDropdown
        className={cx(cs.buttonDropdown, this.props.className)}
        hideArrow
        disabled={this.props.disabled}
        floating
        onChange={this.props.onClick}
        options={this.props.options}
        trigger={this.getButton()}
        direction={this.props.direction}
      />
    );
  }
}

ButtonDropdown.propTypes = {
  className: PropTypes.string,
  disabled: PropTypes.bool,
  icon: PropTypes.element,
  onClick: PropTypes.func,
  options: PropTypes.array,
  primary: PropTypes.bool,
  secondary: PropTypes.bool,
  text: PropTypes.string,
  direction: PropTypes.oneOf(["left", "right"])
};

export default ButtonDropdown;
