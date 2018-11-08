/* This component allows you to easily add a dropdown to any trigger element */
/* Wraps around Semantic UI */
import React from "react";
import cx from "classnames";
import { forbidExtraProps } from "airbnb-prop-types";
import { Dropdown as BaseDropdown } from "semantic-ui-react";
import PropTypes from "prop-types";
import cs from "./bare_dropdown.scss";

class BareDropdown extends React.Component {
  render() {
    return (
      <BaseDropdown
        {...this.props}
        className={cx(cs.dropdown, this.props.className)}
      />
    );
  }
}

BareDropdown.propTypes = forbidExtraProps({
  trigger: PropTypes.node.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  floating: PropTypes.bool,
  scrolling: PropTypes.bool
});

BareDropdown.Menu = BaseDropdown.Menu;
BareDropdown.Item = BaseDropdown.Item;

export default BareDropdown;
