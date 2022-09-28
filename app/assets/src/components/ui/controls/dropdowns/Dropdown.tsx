import cx from "classnames";
import { isNil } from "lodash/fp";
import React from "react";
import BareDropdown from "./BareDropdown";
import DropdownTrigger from "./common/DropdownTrigger";
import cs from "./dropdown.scss";

interface DropdownProps {
  className?: string;
  menuClassName?: string;
  placeholder?: string;
  disabled?: boolean;
  erred?: boolean;
  floating?: boolean;
  scrolling?: boolean;
  fluid?: boolean;
  rounded?: boolean;
  label?: string;
  options: {
    text: string;
    value: string | number;
    // Optional node element will be rendered instead of text.
    // Text will still be used in the <DropdownTrigger>
    customNode?: React.ReactNode;
  }[];
  // Custom props for rendering items
  items?: React.ReactNode[];
  // If search is true, and you provide pre-rendered "items" instead of "options",
  // you must also provide a list of strings to search by.
  itemSearchStrings?: string[];
  onChange: $TSFixMeFunction;
  onClick?: $TSFixMeFunction;
  value?: string | number;
  search?: boolean;
  menuLabel?: string;
  // Optional header that displays between the search box and the options.
  optionsHeader?: React.ReactNode;
  usePortal?: boolean;
  direction?: "left" | "right";
  withinModal?: boolean;
  onFilterChange?: $TSFixMeFunction;
  showNoResultsMessage?: boolean;
  showSelectedItemSubtext?: boolean;
  // Don't show the no results message if search options are still loading.
  // TODO(mark): Visually indicate that search options are loading even if
  // there are old search results to display.
  isLoadingSearchOptions?: boolean;
  nullLabel?: string;
}

class Dropdown extends React.Component<DropdownProps> {
  constructor(props: $TSFixMe) {
    super(props);
    this.state = {
      value: this.props.value !== undefined ? this.props.value : null,
      labels: {},
    };
  }

  componentDidMount() {
    this.buildLabels();
  }

  componentDidUpdate(prevProps: $TSFixMe) {
    // Also guard against NaN.
    if (
      prevProps.value !== this.props.value &&
      !(Number.isNaN(prevProps.value) && Number.isNaN(this.props.value))
    ) {
      this.setState({ value: this.props.value });
    }
    if (prevProps.options !== this.props.options) {
      this.buildLabels();
    }
  }

  buildLabels = () => {
    this.setState({
      labels: this.props.options.reduce(
        (labelMap: $TSFixMe, option: $TSFixMe) => {
          labelMap[option.value.toString()] = option.text;
          return labelMap;
        },
        {},
      ),
      subtexts: this.props.options.reduce(
        (subtextMap: $TSFixMe, option: $TSFixMe) => {
          subtextMap[option.value.toString()] = option.subtext;
          return subtextMap;
        },
        {},
      ),
    });
  };

  handleOnChange = (value: $TSFixMe) => {
    this.setState({ value });
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'labels' does not exist on type 'Readon... Remove this comment to see the full error message
    this.props.onChange(value, this.state.labels[value.toString()]);
  };

  renderTrigger = () => {
    const { nullLabel } = this.props;

    let text;
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'value' does not exist on type 'Readonly<... Remove this comment to see the full error message
    if (!isNil(this.state.value)) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'labels' does not exist on type 'Readonly... Remove this comment to see the full error message
      text = this.state.labels[this.state.value.toString()];
    } else if (nullLabel) {
      text = nullLabel;
    }
    const labelText =
      this.props.label && text ? this.props.label + ":" : this.props.label;

    const itemSubtext =
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'showSelectedItemSubtext' does not exist ... Remove this comment to see the full error message
      this.props.showSelectedItemSubtext && !isNil(this.state.value)
        ? // @ts-expect-error ts-migrate(2339) FIXME: Property 'subtexts' does not exist on type 'Readon... Remove this comment to see the full error message
          this.state.subtexts[this.state.value.toString()]
        : "";

    return (
      <DropdownTrigger
        label={labelText}
        itemSubtext={itemSubtext}
        value={text}
        rounded={this.props.rounded}
        className={cs.dropdownTrigger}
        placeholder={this.props.placeholder}
        erred={this.props.erred}
      />
    );
  };

  render() {
    return (
      <BareDropdown
        className={cx(cs.dropdown, this.props.className)}
        arrowInsideTrigger
        disabled={this.props.disabled}
        fluid={this.props.fluid}
        options={this.props.options}
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'value' does not exist on type 'Readonly<... Remove this comment to see the full error message
        value={this.state.value}
        search={this.props.search}
        menuLabel={this.props.menuLabel}
        floating
        onChange={this.handleOnChange}
        trigger={this.renderTrigger()}
        usePortal={this.props.usePortal}
        direction={this.props.direction}
        withinModal={this.props.withinModal}
        items={this.props.items}
        itemSearchStrings={this.props.itemSearchStrings}
        onFilterChange={this.props.onFilterChange}
        optionsHeader={this.props.optionsHeader}
        showNoResultsMessage={this.props.showNoResultsMessage}
        isLoadingSearchOptions={this.props.isLoadingSearchOptions}
        menuClassName={this.props.menuClassName}
        onClick={this.props.onClick}
      />
    );
  }
}

export default Dropdown;
