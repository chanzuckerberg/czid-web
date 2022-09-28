import cx from "classnames";
import React from "react";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import cs from "./button_dropdown.scss";

interface ButtonDropdownProps {
  className?: string;
  disabled?: boolean;
  icon?: React.ReactElement;
  onClick?: $TSFixMeFunction;
  items?: React.ReactNode[];
  options?: unknown[];
  primary?: boolean;
  secondary?: boolean;
  text?: string;
  direction?: "left" | "right";
}

class ButtonDropdown extends React.Component<ButtonDropdownProps> {
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
        items={this.props.items}
        onChange={this.props.onClick}
        options={this.props.options}
        trigger={this.getButton()}
        direction={this.props.direction}
      />
    );
  }
}

export default ButtonDropdown;
