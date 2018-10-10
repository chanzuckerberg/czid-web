import { Dropdown } from "semantic-ui-react";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import PropTypes from "prop-types";
import React from "react";

class ButtonDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.handleMouseDown = this.handleMouseDown.bind(this);
  }

  getButton() {
    if (this.props.primary) {
      return (
        <PrimaryButton
          text={this.props.text}
          disabled={this.props.disabled}
          icon={this.props.icon}
        />
      );
    } else {
      return (
        <SecondaryButton
          text={this.props.text}
          disabled={this.props.disabled}
          icon={this.props.icon}
        />
      );
    }
  }

  handleMouseDown(event) {
    const selectedText = event.target.textContent;
    if (selectedText) {
      const selectedOption = this.props.options.find(function(option) {
        return option.text == selectedText;
      });
      if (selectedOption) {
        this.props.onClick(selectedOption.value);
      }
    }
  }

  render() {
    return (
      <Dropdown
        className={`idseq-ui button-dropdown button ${
          this.props.primary ? "primary" : "secondary"
        }`}
        disabled={this.props.disabled}
        floating
        onMouseDown={this.handleMouseDown}
        options={this.props.options}
        trigger={this.getButton()}
      />
    );
  }
}

ButtonDropdown.propTypes = {
  disabled: PropTypes.bool,
  icon: PropTypes.element,
  onClick: PropTypes.func,
  options: PropTypes.array,
  primary: PropTypes.bool,
  secondary: PropTypes.bool,
  text: PropTypes.string
};

export default ButtonDropdown;
