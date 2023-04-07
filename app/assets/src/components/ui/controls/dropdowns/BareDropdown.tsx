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
import cx from "classnames";
import {
  compact,
  filter,
  get,
  identity,
  isEmpty,
  map,
  nth,
  omit,
  sortBy,
  zip,
} from "lodash/fp";
import { nanoid } from "nanoid";
import React from "react";
import {
  Dropdown as BaseDropdown,
  DropdownDivider,
  DropdownHeader,
  DropdownItem,
} from "semantic-ui-react";
import Input from "~ui/controls/Input";
import { IconArrowDownSmall, IconSearch } from "~ui/icons";
import cs from "./bare_dropdown.scss";
import PortalDropdown from "./PortalDropdown";

interface BareDropdownProps {
  // Custom props
  // whether the arrow should be displayed outside the trigger or inside it.
  arrowInsideTrigger?: boolean;
  hideArrow?: boolean;
  smallArrow?: boolean;
  menuLabel?: string;
  // Optional header that displays between the search box and the options.
  optionsHeader?: React.ReactNode;
  // whether the dropdown should close when you click on the menu. Useful for custom dropdown menus.
  closeOnClick?: boolean;
  search?: boolean;
  // If search is true, and you provide pre-rendered "items" instead of "options",
  // you must also provide a list of strings to search by.
  itemSearchStrings?: string[];
  // Custom prop for rendering items within sections.
  // It is a mapping between the section and the itemSearchStrings in that section.
  // Mainly used to put searched/filtered items back into their respective sections.
  sections?: object;
  // If search is true, but you want to customize behavior of search function, e.g. async search,
  // you should provide your own handler
  onFilterChange?: $TSFixMeFunction;
  showNoResultsMessage?: boolean;
  // Don't show the no results message if search options are currently loading.
  // TODO(mark): Visually indicate that search options are loading even if
  // there are old search results to display.
  isLoadingSearchOptions?: boolean;
  // Custom props for rendering options
  options?: {
    value?: $TSFixMe;
    text?: React.ReactNode;
    disabled?: boolean;
    // Custom node to render for the option.
    customNode?: React.ReactNode;
  }[];
  value?: $TSFixMe;
  onChange?: $TSFixMeFunction;
  // Custom props for rendering items
  items?: React.ReactNode[];
  usePortal?: boolean;
  // Whether to increase the z-index of the menu to be above the Modal z-index.
  // Useful for PortalDropdowns.
  withinModal?: boolean;
  // Props directly passed to semantic-ui.
  children?: React.ReactNode;
  className?: string;
  direction?: "left" | "right";
  disabled?: boolean;
  floating?: boolean;
  fluid?: boolean;
  menuClassName?: string;
  onBlur?: $TSFixMeFunction;
  onClick?: $TSFixMeFunction;
  onClose?: $TSFixMeFunction;
  onFocus?: $TSFixMeFunction;
  onMouseEnter?: $TSFixMeFunction;
  onMouseLeave?: $TSFixMeFunction;
  onOpen?: $TSFixMeFunction;
  open?: boolean;
  selectOnBlur?: boolean;
  trigger: React.ReactNode;
  disableAutocomplete?: boolean;
}

interface BareDropdownState {
  filterString: string;
}

class BareDropdown extends React.Component<
  BareDropdownProps,
  BareDropdownState
> {
  baseDropdownRef: $TSFixMe;
  static Divider: typeof DropdownDivider;
  static Header: typeof DropdownHeader;
  static Item: typeof DropdownItem;
  constructor(props: BareDropdownProps) {
    super(props);

    this.baseDropdownRef = React.createRef();

    this.state = {
      filterString: "",
    };
  }

  // If the user provides us options instead of items, we will render them like this.
  renderItemsDefault = (options: $TSFixMe) => {
    return options.map((option: $TSFixMe) =>
      option.customNode ? (
        <div
          key={option.value}
          onClick={() => this.props.onChange(option.value)}
          className={cx(
            cs.item,
            this.props.value === option.value && cs.active,
          )}>
          {option.customNode}
        </div>
      ) : (
        <BaseDropdown.Item
          key={option.value}
          onClick={() => this.props.onChange(option.value)}
          active={this.props.value === option.value}
          className={cs.item}
          disabled={option.disabled || false}>
          {option.text}
        </BaseDropdown.Item>
      ),
    );
  };

  handleFilterChange = (filterString: $TSFixMe) => {
    const { onFilterChange } = this.props;

    this.setState(
      {
        filterString,
      },
      () => {
        onFilterChange && onFilterChange(filterString);
      },
    );
  };

  matchesFilter = (text: $TSFixMe, filterString: $TSFixMe) =>
    text &&
    filterString &&
    text.toLowerCase().includes(filterString.toLowerCase());

  // Return 0 if starts with prefix, 1 otherwise
  prioritizePrefixMatches = (option: $TSFixMe, prefix: $TSFixMe) =>
    option.toLowerCase().startsWith(prefix.toLowerCase()) ? 0 : 1;

  getFilteredItems = (filterString: $TSFixMe) => {
    const { items, itemSearchStrings, options, sections } = this.props;
    if (!items && !options) return;

    if (filterString === "") {
      // If options are provided, render them as dropdown items the default way.
      return items || this.renderItemsDefault(options);
    }

    if (items) {
      // Exclude Headers, Dividers, and unsearchable items from being zipped up with the itemSearchStrings
      const itemsToZip = !isEmpty(sections)
        ? items.filter(
            (item: $TSFixMe) =>
              item.type !== BareDropdown.Header &&
              item.type !== BareDropdown.Divider &&
              get("props.flag", item) !== "unsearchable",
          )
        : items;

      // Use the separate itemSearchStrings array to filter the items.
      const pairs = zip(itemSearchStrings, itemsToZip);
      const filteredPairs = filter(
        pair => this.matchesFilter(pair[0], filterString),
        pairs,
      );
      const sortedPairs = sortBy(
        pair => this.prioritizePrefixMatches(pair[0], filterString),
        filteredPairs,
      );

      return !isEmpty(sections)
        ? // If the items are in sections, categorize the search results back into their sections.
          // Otherwise just return the items (uncategorized).
          this.categorizeSearchResults(sortedPairs)
        : map(nth(1), sortedPairs);
    } else {
      const filteredOptions = options.filter((option: $TSFixMe) =>
        this.matchesFilter(option.text, filterString),
      );
      const sortedOptions = sortBy(
        option => this.prioritizePrefixMatches(option.text, filterString),
        filteredOptions,
      );
      return this.renderItemsDefault(sortedOptions);
    }
  };

  categorizeSearchResults = (uncategorizedItemPairs: $TSFixMe) => {
    const { sections } = this.props;
    const categorizedItems: $TSFixMe = [];

    Object.entries(sections).forEach(([sectionName, itemStringsInSection]) => {
      const sectionItems = compact(
        uncategorizedItemPairs.map(
          ([itemSearchResultString, item]) =>
            itemStringsInSection.has(itemSearchResultString) && item,
        ),
      );

      if (isEmpty(sectionItems)) {
        sectionItems.push(this.renderNoResultsFoundInSection());
      }

      const header = (
        <BareDropdown.Header
          content={sectionName}
          key={`${sectionName}_header`}
        />
      );
      const divider = <BareDropdown.Divider key={`${sectionName}_divider`} />;
      categorizedItems.push(header, ...sectionItems, divider);
    });

    // Remove the last divider
    categorizedItems.pop();
    return categorizedItems;
  };

  renderNoResultsFoundInSection = () => (
    <BareDropdown.Item className={cs.emptySection} key={nanoid()}>
      <div className={cs.message}>
        There are no results matching your search.
      </div>
    </BareDropdown.Item>
  );

  handleMenuClick = (e: $TSFixMe) => {
    const { closeOnClick, search } = this.props;

    if (!closeOnClick) {
      // Ensure that the dropdown doesn't close when the menu is clicked
      // if closeOnClick is false
      e.stopPropagation();
    } else if (search && this.baseDropdownRef.current) {
      // When search is true, semantic-ui doesn't close the dropdown when the menu is clicked
      // for some reason. Manually close it in this case.
      this.baseDropdownRef.current.close();
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
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      closeOnClick,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      itemSearchStrings,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      usePortal,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      withinModal,
      children,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onFilterChange,
      menuClassName,
      disableAutocomplete,
      trigger,
      optionsHeader,
      showNoResultsMessage,
      isLoadingSearchOptions,
      ...otherProps
    } = this.props;

    const dropdownClassName = cx(
      cs.bareDropdown,
      !hideArrow &&
        (arrowInsideTrigger ? cs.arrowInsideTrigger : cs.arrowOutsideTrigger),
      className,
      smallArrow && cs.smallArrow,
    );

    const { filterString } = this.state;

    let wrappedTrigger = trigger;

    // When search is true, semantic-ui doesn't close the dropdown when the trigger is clicked
    // for some reason. Manually close it in this case.
    if (this.props.search) {
      // When search is true, inject an onClick handler onto the trigger element.
      // @ts-expect-error  Type 'string' is not assignable to type
      wrappedTrigger = React.cloneElement(trigger, {
        onClick: () => {
          // Manually close the base dropdown if it's open.
          // NOTE: Accessing the state of a child component is generally bad practice.
          // Doing it here only because it's a 3rd party component that doesn't support the behavior we want.
          if (
            this.props.search &&
            this.baseDropdownRef.current &&
            this.baseDropdownRef.current.state.open
          ) {
            this.baseDropdownRef.current.close();
          }

          // Make sure the trigger's original onClick handler is still called, if it was set.
          // @ts-expect-error Property 'props' does not exist on type 'ReactNode'.
          if (trigger.props.onClick) {
            // @ts-expect-error Property 'props' does not exist on type 'ReactNode'.
            trigger.props.onClick();
          }
        },
      });
    }

    // Allows you the flexibility to put stuff OTHER than a menu of options in the dropdown.
    if (!this.props.options && !this.props.items) {
      return (
        <BaseDropdown
          {...otherProps}
          trigger={wrappedTrigger}
          className={dropdownClassName}
          onBlur={e => e.stopPropagation()}
          icon={
            hideArrow || <IconArrowDownSmall className={cs.dropdownArrow} />
          }>
          <BaseDropdown.Menu onClick={this.handleMenuClick}>
            {children}
          </BaseDropdown.Menu>
        </BaseDropdown>
      );
    }

    if (this.props.options && this.props.items) {
      throw new Error(
        "Only one of options or items should be provided to <BareDropdown>",
      );
    }

    const baseDropdownProps = omit(
      ["options", "value", "onChange", "items"],
      otherProps,
    );

    const filteredItems = this.getFilteredItems(filterString);

    const menu = (
      <BaseDropdown.Menu
        className={cx(
          cs.menu,
          cs.dropdownMenu,
          (menuLabel || search) && cs.extraPadding,
          menuClassName,
        )}
        onClick={this.handleMenuClick}>
        {menuLabel && <div className={cs.menuLabel}>{menuLabel}</div>}
        {search && (
          <div
            onClick={e => e.stopPropagation()}
            className={cs.searchContainer}>
            <Input
              fluid
              className={cs.searchInput}
              icon={<IconSearch className={cs.searchInputIcon} />}
              placeholder="Search"
              value={filterString}
              onChange={this.handleFilterChange}
              disableAutocomplete={disableAutocomplete}
            />
          </div>
        )}
        {optionsHeader && (
          <div className={cs.optionsHeader}>{optionsHeader}</div>
        )}
        <BaseDropdown.Menu scrolling className={cs.innerMenu}>
          {filteredItems}
        </BaseDropdown.Menu>
        {filteredItems.length === 0 &&
          showNoResultsMessage &&
          !isLoadingSearchOptions && (
            <div className={cs.noResultsMessage}>No results found.</div>
          )}
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
          trigger={wrappedTrigger}
          triggerClassName={className}
          withinModal={this.props.withinModal}
        />
      );
    }

    // When search is enabled, we need to tell semantic-ui that we are in search mode.
    // Otherwise, pressing spacebar will cause the dropdown to close.
    // See https://github.com/Semantic-Org/Semantic-UI-React/issues/3768
    // This causes other issues. Specifically, now when you click on the trigger or any items,
    // the dropdown no longer closes at all. You have to click outside the dropdown.
    return (
      <BaseDropdown
        {...baseDropdownProps}
        trigger={wrappedTrigger}
        className={dropdownClassName}
        onBlur={e => e.stopPropagation()}
        search={search ? identity : undefined}
        ref={this.baseDropdownRef}
        icon={
          !hideArrow && <IconArrowDownSmall className={cs.dropdownArrow} />
        }>
        {menu}
      </BaseDropdown>
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
BareDropdown.defaultProps = {
  closeOnClick: true,
};

BareDropdown.Header = BaseDropdown.Header;
BareDropdown.Item = BaseDropdown.Item;
BareDropdown.Divider = BaseDropdown.Divider;

export default BareDropdown;
