// This component allows you to easily add a dropdown of options to any trigger element
// Wraps around Semantic UI Dropdown, with react-popper as an alternative.

// NOTE ABOUT CUSTOMIZING THE DROPDOWN:
// If you don't want the user to be able to select a value, and you want to specify
// custom onClick behavior yourself, use props.options. For example, if you want to provide the user
// with a menu of options.
// If you do want the user to be able to select a value, and you want the option to be rendered in a
// custom way, use props.items and specify a "customNode" for each item.

// TODO(mark): Refactor this component to remove props.options and props.itemSearchStrings, which are confusing and
// redundant with props.items.customNode and props.children.
import React from "react";
import cx from "classnames";
import { omit, zip, filter, map, nth, sortBy } from "lodash/fp";
import { forbidExtraProps } from "airbnb-prop-types";
import { Dropdown as BaseDropdown } from "semantic-ui-react";
import Input from "~ui/controls/Input";
import PropTypes from "prop-types";
import PortalDropdown from "./PortalDropdown.jsx";
import cs from "./bare_dropdown.scss";

class BareDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      filterString: "",
    };
  }

  // If the user provides us options instead of items, we will render them like this.
  renderItemsDefault = options => {
    return options.map(
      option =>
        option.customNode ? (
          <div
            key={option.value}
            onClick={() => this.props.onChange(option.value)}
            className={cx(
              cs.item,
              this.props.value === option.value && cs.active
            )}
          >
            {option.customNode}
          </div>
        ) : (
          <BaseDropdown.Item
            key={option.value}
            onClick={() => this.props.onChange(option.value)}
            active={this.props.value === option.value}
            className={cs.item}
          >
            {option.text}
          </BaseDropdown.Item>
        )
    );
  };

  handleFilterChange = filterString => {
    const { onFilterChange } = this.props;

    this.setState(
      {
        filterString,
      },
      () => {
        onFilterChange && onFilterChange(filterString);
      }
    );
  };

  matchesFilter = (text, filterString) =>
    text &&
    filterString &&
    text.toLowerCase().includes(filterString.toLowerCase());

  // Return 0 if starts with prefix, 1 otherwise
  prioritizePrefixMatches = (option, prefix) =>
    option.toLowerCase().startsWith(prefix.toLowerCase()) ? 0 : 1;

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
      const sortedPairs = sortBy(
        pair => this.prioritizePrefixMatches(pair[0], filterString),
        filteredPairs
      );
      return map(nth(1), sortedPairs);
    } else {
      const filteredOptions = this.props.options.filter(option =>
        this.matchesFilter(option.text, filterString)
      );
      const sortedOptions = sortBy(
        option => this.prioritizePrefixMatches(option.text, filterString),
        filteredOptions
      );
      return this.renderItemsDefault(sortedOptions);
    }
  };

  render() {
    const {
      arrowInsideTrigger,
      className,
      hideArrow,
      smallArrow,
      menuLabel,
      search,
      closeOnClick,
      itemSearchStrings,
      usePortal,
      withinModal,
      children,
      onFilterChange,
      menuClassName,
      ...otherProps
    } = this.props;

    const dropdownClassName = cx(
      cs.bareDropdown,
      !hideArrow &&
        (arrowInsideTrigger ? cs.arrowInsideTrigger : cs.arrowOutsideTrigger),
      className,
      hideArrow && cs.hideArrow,
      smallArrow && cs.smallArrow
    );

    const { filterString } = this.state;

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

    const filteredItems = this.getFilteredItems(filterString);

    const menu = (
      <BaseDropdown.Menu
        className={cx(
          cs.menu,
          cs.dropdownMenu,
          (menuLabel || search) && cs.extraPadding,
          menuClassName
        )}
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
          {filteredItems}
        </BaseDropdown.Menu>
      </BaseDropdown.Menu>
    );

    if (this.props.usePortal) {
      return (
        <PortalDropdown
          arrowInsideTrigger={arrowInsideTrigger}
          floating={this.props.floating}
          fluid={this.props.fluid}
          direction={this.props.direction}
          disabled={this.props.disabled}
          hideArrow={hideArrow}
          menu={menu}
          menuClassName={cx(cs.portalDropdown, className)}
          onOpen={this.props.onOpen}
          open={this.props.open}
          onClose={this.props.onClose}
          trigger={this.props.trigger}
          triggerClassName={className}
          withinModal={this.props.withinModal}
        />
      );
    }

    return (
      <BaseDropdown
        {...baseDropdownProps}
        className={dropdownClassName}
        onBlur={e => e.stopPropagation()}
      >
        {menu}
      </BaseDropdown>
    );
  }
}

BareDropdown.propTypes = forbidExtraProps({
  // Custom props
  // whether the arrow should be displayed outside the trigger or inside it.
  arrowInsideTrigger: PropTypes.bool,
  hideArrow: PropTypes.bool,
  smallArrow: PropTypes.bool,
  menuLabel: PropTypes.string,
  // whether the dropdown should close when you click on the menu. Useful for custom dropdown menus.
  closeOnClick: PropTypes.bool,
  search: PropTypes.bool,
  // If search is true, and you provide pre-rendered "items" instead of "options",
  // you must also provide a list of strings to search by.
  itemSearchStrings: PropTypes.arrayOf(PropTypes.string),
  // If search is true, but you want to customize behavior of search function, e.g. async search,
  // you should provide your own handler
  onFilterChange: PropTypes.func,

  // Custom props for rendering options
  options: PropTypes.arrayOf(
    PropTypes.shape({
      value: PropTypes.any,
      text: PropTypes.node,
      // Custom node to render for the option.
      customNode: PropTypes.node,
    })
  ),
  value: PropTypes.any,
  onChange: PropTypes.func,

  // Custom props for rendering items
  items: PropTypes.arrayOf(PropTypes.node),

  usePortal: PropTypes.bool,
  // Whether to increase the z-index of the menu to be above the Modal z-index.
  // Useful for PortalDropdowns.
  withinModal: PropTypes.bool,

  // Props directly passed to semantic-ui.
  children: PropTypes.node,
  className: PropTypes.string,
  direction: PropTypes.string,
  disabled: PropTypes.bool,
  floating: PropTypes.bool,
  fluid: PropTypes.bool,
  menuClassName: PropTypes.string,
  onBlur: PropTypes.func,
  onClick: PropTypes.func,
  onClose: PropTypes.func,
  onFocus: PropTypes.func,
  onMouseEnter: PropTypes.func,
  onMouseLeave: PropTypes.func,
  onOpen: PropTypes.func,
  open: PropTypes.bool,
  selectOnBlur: PropTypes.bool,
  trigger: PropTypes.node.isRequired,
});

BareDropdown.defaultProps = {
  closeOnClick: true,
};

BareDropdown.Header = BaseDropdown.Header;
BareDropdown.Item = BaseDropdown.Item;

export default BareDropdown;
