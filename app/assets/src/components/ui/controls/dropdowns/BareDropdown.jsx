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
      prevProps.options !== this.props.options
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

    const baseDropdownProps = omit(
      ["options", "value", "onChange", "items"],
      otherProps
    );

    return (
      <BaseDropdown {...baseDropdownProps} className={dropdownClassName}>
        <BaseDropdown.Menu
          className={cx(cs.menu, (menuLabel || search) && cs.extraPadding)}
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
  trigger: PropTypes.node.isRequired,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any,
      text: PropTypes.string
    })
  ),
  items: PropTypes.arrayOf(PropTypes.node),
  // If search is true, and you provide pre-rendered "items" instead of "options", you must also provide a list of strings to search by.
  itemSearchStrings: PropTypes.arrayOf(PropTypes.string),
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
  menuLabel: PropTypes.string,
  search: PropTypes.bool,
  direction: PropTypes.string
});

BareDropdown.Header = BaseDropdown.Header;
BareDropdown.Menu = BaseDropdown.Menu;
BareDropdown.Item = BaseDropdown.Item;

export default BareDropdown;
