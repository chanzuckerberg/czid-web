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
      !(isNaN(prevProps.value) && isNaN(this.props.value))
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
    return (
      <DropdownTrigger
        label={this.props.label}
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
        selectOnBlur={false}
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
        .isRequired
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  search: PropTypes.bool,
  menuLabel: PropTypes.string
};

export default Dropdown;
