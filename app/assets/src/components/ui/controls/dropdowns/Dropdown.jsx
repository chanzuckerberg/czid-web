import cx from "classnames";
import { isNil } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import BareDropdown from "./BareDropdown";
import DropdownTrigger from "./common/DropdownTrigger";
import cs from "./dropdown.scss";

class Dropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value !== undefined ? this.props.value : null,
      labels: {},
    };
  }

  componentDidMount() {
    this.buildLabels();
  }

  componentDidUpdate(prevProps) {
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
      labels: this.props.options.reduce((labelMap, option) => {
        labelMap[option.value.toString()] = option.text;
        return labelMap;
      }, {}),
      subtexts: this.props.options.reduce((subtextMap, option) => {
        subtextMap[option.value.toString()] = option.subtext;
        return subtextMap;
      }, {}),
    });
  };

  handleOnChange = value => {
    this.setState({ value });
    this.props.onChange(value, this.state.labels[value.toString()]);
  };

  renderTrigger = () => {
    const { nullLabel } = this.props;

    let text;
    if (!isNil(this.state.value)) {
      text = this.state.labels[this.state.value.toString()];
    } else if (nullLabel) {
      text = nullLabel;
    }
    const labelText =
      this.props.label && text ? this.props.label + ":" : this.props.label;

    const itemSubtext =
      this.props.showSelectedItemSubtext && !isNil(this.state.value)
        ? this.state.subtexts[this.state.value.toString()]
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

Dropdown.propTypes = {
  className: PropTypes.string,
  menuClassName: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  erred: PropTypes.bool,
  fluid: PropTypes.bool,
  rounded: PropTypes.bool,
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
        .isRequired,
      // Optional node element will be rendered instead of text.
      // Text will still be used in the <DropdownTrigger>
      customNode: PropTypes.node,
    }),
  ).isRequired,
  // Custom props for rendering items
  items: PropTypes.arrayOf(PropTypes.node),
  // If search is true, and you provide pre-rendered "items" instead of "options",
  // you must also provide a list of strings to search by.
  itemSearchStrings: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  search: PropTypes.bool,
  menuLabel: PropTypes.string,
  // Optional header that displays between the search box and the options.
  optionsHeader: PropTypes.node,
  usePortal: PropTypes.bool,
  direction: PropTypes.oneOf(["left", "right"]),
  withinModal: PropTypes.bool,
  onFilterChange: PropTypes.func,
  showNoResultsMessage: PropTypes.bool,
  showSelectedItemSubtext: PropTypes.bool,
  // Don't show the no results message if search options are still loading.
  // TODO(mark): Visually indicate that search options are loading even if
  // there are old search results to display.
  isLoadingSearchOptions: PropTypes.bool,
  nullLabel: PropTypes.string,
};

export default Dropdown;
