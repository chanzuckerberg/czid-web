// This component allows you to easily add a dropdown of options to any trigger element
// Wraps around Semantic UI Dropdown

import React from "react";
import cx from "classnames";
import { omit, zip, filter, map, nth } from "lodash/fp";
import { forbidExtraProps } from "airbnb-prop-types";
import { Dropdown as BaseDropdown } from "semantic-ui-react";
import Input from "~ui/controls/Input";
import PropTypes from "prop-types";
import cs from "./bare_dropdown.scss";

class BareDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filterString: "",
      filteredItems: this.getFilteredItems("")
    };
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.items !== this.props.items ||
      prevProps.options !== this.props.options ||
      prevProps.value !== this.props.value
    ) {
      this.setState({
        filteredItems: this.getFilteredItems(this.state.filterString)
      });
    }
  }

  // If the user provides us options instead of items, we will render them like this.
  renderItemsDefault = options => {
    return options.map(option => (
      <BaseDropdown.Item
        key={option.value}
        onClick={() => this.props.onChange(option.value)}
        active={this.props.value === option.value}
      >
        {option.text}
      </BaseDropdown.Item>
    ));
  };

  handleFilterChange = filterString => {
    this.setState({
      filterString,
      filteredItems: this.getFilteredItems(filterString)
    });
  };

  matchesFilter = (text, filterString) =>
    text &&
    filterString &&
    text.toLowerCase().includes(filterString.toLowerCase());

  getFilteredItems = filterString => {
    if (!this.props.items && !this.props.options) return;

    if (filterString === "") {
      // If options are provided, render them as dropdown items the default way.
      return this.props.items || this.renderItemsDefault(this.props.options);
    }

    if (this.props.items) {
      // Use the separate itemSearchStrings array to filter the items.
      const pairs = zip(this.props.itemSearchStrings, this.props.items);
      const filteredPairs = filter(
        pair => this.matchesFilter(pair[0], filterString),
        pairs
      );
      return map(nth(1), filteredPairs);
    } else {
      const filteredOptions = this.props.options.filter(option =>
        this.matchesFilter(option.text, filterString)
      );
      return this.renderItemsDefault(filteredOptions);
    }
  };

  render() {
    const {
      arrowInsideTrigger,
      className,
      hideArrow,
      menuLabel,
      search,
      closeOnClick,
      itemSearchStrings,
      children,
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
      return (
        <BaseDropdown
          {...otherProps}
          className={dropdownClassName}
          onBlur={e => e.stopPropagation()}
        >
          <BaseDropdown.Menu
            onClick={!closeOnClick ? e => e.stopPropagation() : undefined}
          >
            {children}
          </BaseDropdown.Menu>
        </BaseDropdown>
      );
    }

    if (this.props.options && this.props.items) {
      throw new Error(
        "Only one of options or items should be provided to <BareDropdown>"
      );
    }

    const baseDropdownProps = omit(
      ["options", "value", "onChange", "items"],
      otherProps
    );

    return (
      <BaseDropdown
        {...baseDropdownProps}
        className={dropdownClassName}
        onBlur={e => e.stopPropagation()}
      >
        <BaseDropdown.Menu
          className={cx(cs.menu, (menuLabel || search) && cs.extraPadding)}
          onClick={!closeOnClick ? e => e.stopPropagation() : undefined}
        >
          {menuLabel && <div className={cs.menuLabel}>{menuLabel}</div>}
          {search && (
            <div
              onClick={e => e.stopPropagation()}
              className={cs.searchContainer}
            >
              <Input
                fluid
                className={cs.searchInput}
                icon="search"
                placeholder="Search"
                onChange={this.handleFilterChange}
              />
            </div>
          )}
          <BaseDropdown.Menu scrolling className={cs.innerMenu}>
            {this.state.filteredItems}
          </BaseDropdown.Menu>
        </BaseDropdown.Menu>
      </BaseDropdown>
    );
  }
}

BareDropdown.propTypes = forbidExtraProps({
  // Custom props
  // whether the arrow should be displayed outside the trigger or inside it.
  arrowInsideTrigger: PropTypes.bool,
  hideArrow: PropTypes.bool,
  menuLabel: PropTypes.string,
  // whether the dropdown should close when you click on the menu. Useful for custom dropdown menus.
  closeOnClick: PropTypes.bool,
  search: PropTypes.bool,
  // If search is true, and you provide pre-rendered "items" instead of "options",
  // you must also provide a list of strings to search by.
  itemSearchStrings: PropTypes.arrayOf(PropTypes.string),

  // Custom props for rendering options
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any,
      text: PropTypes.node
    })
  ),
  value: PropTypes.any,
  onChange: PropTypes.func,

  // Custom props for rendering items
  items: PropTypes.arrayOf(PropTypes.node),

  // Props directly passed to semantic-ui.
  trigger: PropTypes.node.isRequired,
  onBlur: PropTypes.func,
  onFocus: PropTypes.func,
  onOpen: PropTypes.func,
  onClose: PropTypes.func,
  open: PropTypes.bool,
  children: PropTypes.node,
  className: PropTypes.string,
  floating: PropTypes.bool,
  disabled: PropTypes.bool,
  selectOnBlur: PropTypes.bool,
  fluid: PropTypes.bool,
  placeholder: PropTypes.string,
  direction: PropTypes.string
});

BareDropdown.defaultProps = {
  closeOnClick: true
};

BareDropdown.Header = BaseDropdown.Header;
BareDropdown.Item = BaseDropdown.Item;

export default BareDropdown;
