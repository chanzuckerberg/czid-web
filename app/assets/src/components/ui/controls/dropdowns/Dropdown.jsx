import React from "react";
import BareDropdown from "./BareDropdown";
import DropdownTrigger from "./common/DropdownTrigger";
import PropTypes from "prop-types";
import cx from "classnames";
import cs from "./dropdown.scss";

class Dropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value !== undefined ? this.props.value : null,
      labels: {}
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
      }, {})
    });
  };

  handleOnChange = value => {
    this.setState({ value });
    this.props.onChange(value, this.state.labels[value.toString()]);
  };

  renderTrigger = () => {
    const text =
      this.state.value !== undefined && this.state.value !== null ? (
        <span>{this.state.labels[this.state.value.toString()]}</span>
      ) : (
        <span className={cs.placeholder}>{this.props.placeholder}</span>
      );

    const hasText =
      this.state.value !== undefined &&
      this.state.value !== null &&
      this.state.labels[this.state.value.toString()];
    const labelText =
      this.props.label && hasText ? this.props.label + ":" : this.props.label;

    return (
      <DropdownTrigger
        label={labelText}
        value={text}
        rounded={this.props.rounded}
        className={cs.dropdownTrigger}
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
        withinModal={this.props.withinModal}
        items={this.props.items}
        itemSearchStrings={this.props.itemSearchStrings}
      />
    );
  }
}

Dropdown.propTypes = {
  className: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
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
      customNode: PropTypes.node
    })
  ).isRequired,
  // Custom props for rendering items
  items: PropTypes.arrayOf(PropTypes.node),
  // If search is true, and you provide pre-rendered "items" instead of "options",
  // you must also provide a list of strings to search by.
  itemSearchStrings: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  search: PropTypes.bool,
  menuLabel: PropTypes.string,
  usePortal: PropTypes.bool,
  withinModal: PropTypes.bool
};

export default Dropdown;
