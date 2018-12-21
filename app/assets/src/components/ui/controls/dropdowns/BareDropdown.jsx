// This component allows you to easily add a dropdown of options to any trigger element
// Wraps around Semantic UI Dropdown

import React from "react";
import cx from "classnames";
import { omit } from "lodash/fp";
import { forbidExtraProps } from "airbnb-prop-types";
import { Dropdown as BaseDropdown } from "semantic-ui-react";
import PropTypes from "prop-types";
import cs from "./bare_dropdown.scss";

class BareDropdown extends React.Component {
  // If the user provides us options instead of items, we will render them like this.
  renderItemsDefault = () => {
    return this.props.options.map(option => (
      <BaseDropdown.Item
        key={option.value}
        onClick={() => this.props.onChange(option.value)}
        active={this.props.value === option.value}
      >
        {option.text}
      </BaseDropdown.Item>
    ));
  };

  render() {
    const {
      arrowInsideTrigger,
      className,
      hideArrow,
      menuLabel,
      ...otherProps
    } = this.props;

    const dropdownClassName = cx(
      cs.bareDropdown,
      !hideArrow &&
        (arrowInsideTrigger ? cs.arrowInsideTrigger : cs.arrowOutsideTrigger),
      className,
      hideArrow && cs.hideArrow
    );

    // Allows you the flexibility to put stuff OTHER than a menu of options in the dropdown.
    if (!this.props.options && !this.props.items) {
      return <BaseDropdown {...otherProps} className={dropdownClassName} />;
    }

    if (this.props.options && this.props.items) {
      throw new Error(
        "Only one of options or items should be provided to <BareDropdown>"
      );
    }

    // If options are provided, render them as dropdown items the default way.
    const items = this.props.items || this.renderItemsDefault();

    const baseDropdownProps = omit(
      ["options", "value", "onChange", "items"],
      otherProps
    );

    return (
      <BaseDropdown {...baseDropdownProps} className={dropdownClassName}>
        <BaseDropdown.Menu className={cs.menu}>
          {menuLabel && <div className={cs.menuLabel}>{menuLabel}</div>}
          <BaseDropdown.Menu scrolling className={cs.innerMenu}>
            {items}
          </BaseDropdown.Menu>
        </BaseDropdown.Menu>
      </BaseDropdown>
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
  items: PropTypes.arrayOf(PropTypes.node),
  value: PropTypes.any,
  onChange: PropTypes.func,
  children: PropTypes.node,
  className: PropTypes.string,
  floating: PropTypes.bool,
  hideArrow: PropTypes.bool,
  disabled: PropTypes.bool,
  selectOnBlur: PropTypes.bool,
  fluid: PropTypes.bool,
  placeholder: PropTypes.string,
  arrowInsideTrigger: PropTypes.bool, // whether the arrow should be displayed outside the trigger or inside it.
  menuLabel: PropTypes.string
});

BareDropdown.Header = BaseDropdown.Header;
BareDropdown.Menu = BaseDropdown.Menu;
BareDropdown.Item = BaseDropdown.Item;

export default BareDropdown;
