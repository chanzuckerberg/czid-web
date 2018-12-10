// This component allows you to easily add a dropdown of options to any trigger element
// Wraps around Semantic UI Dropdown
import React from "react";
import cx from "classnames";
import { forbidExtraProps } from "airbnb-prop-types";
import { Dropdown as BaseDropdown } from "semantic-ui-react";
import PropTypes from "prop-types";
import cs from "./bare_dropdown.scss";

class BareDropdown extends React.Component {
  render() {
    const {
      arrowInsideTrigger,
      className,
      hideArrow,
      ...otherProps
    } = this.props;

    return (
      <BaseDropdown
        {...otherProps}
        className={cx(
          cs.bareDropdown,
          arrowInsideTrigger ? cs.arrowInsideTrigger : cs.arrowOutsideTrigger,
          className,
          hideArrow && cs.hideArrow
        )}
      />
    );
  }
}

BareDropdown.propTypes = forbidExtraProps({
  trigger: PropTypes.node.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any,
      text: PropTypes.string
    })
  ),
  value: PropTypes.any,
  onChange: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  floating: PropTypes.bool,
  scrolling: PropTypes.bool,
  hideArrow: PropTypes.bool,
  disabled: PropTypes.bool,
  selectOnBlur: PropTypes.bool,
  fluid: PropTypes.bool,
  placeholder: PropTypes.string,
  arrowInsideTrigger: PropTypes.bool // whether the arrow should be displayed outside the trigger or inside it.
});

BareDropdown.Header = BaseDropdown.Header;
BareDropdown.Menu = BaseDropdown.Menu;
BareDropdown.Item = BaseDropdown.Item;

export default BareDropdown;
