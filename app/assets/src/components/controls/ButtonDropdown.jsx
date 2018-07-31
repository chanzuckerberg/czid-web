import { Dropdown, Icon } from "semantic-ui-react";
import SecondaryButton from "./SecondaryButton";
import PropTypes from "prop-types";
import React from "react";

class ButtonDropdown extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {
    return (
      <Dropdown
        className="idseq-ui button"
        disabled={this.props.disabled}
        floating
        onChange={this.props.onClick}
        options={this.props.options}
        trigger={
          <SecondaryButton
            text={this.props.text}
            disabled={this.props.disabled}
            icon={<Icon size="large" className={"cloud download alternate"} />}
          />
        }
      />
    );
  }
}

ButtonDropdown.propTypes = {
  disabled: PropTypes.bool,
  onClick: PropTypes.func,
  options: PropTypes.array,
  text: PropTypes.string
};

export default ButtonDropdown;
