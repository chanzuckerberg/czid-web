import React from "react";
import { Dropdown as BaseDropdown } from "semantic-ui-react";
import PropTypes from "prop-types";
import cx from "classnames";

class Dropdown extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: this.props.value !== undefined ? this.props.value : null
    };
    this.labels = this.props.options.reduce((labelMap, option) => {
      labelMap[option.value.toString()] = option.text;
      return labelMap;
    }, {});
  }

  componentWillReceiveProps(newProps) {
    if (newProps.value != this.props.value) {
      this.setState({ value: newProps.value });
    }
  }

  handleOnChange(e, d) {
    this.setState({ value: d.value });
    this.props.onChange(d.value, this.labels[d.value]);
  }

  renderText() {
    return (
      <div>
        <span className="label-title">{this.props.label}</span>
        {this.state.value !== undefined &&
          this.state.value !== null &&
          this.labels[this.state.value.toString()]}
      </div>
    );
  }

  render() {
    return (
      <BaseDropdown
        placeholder={this.props.placeholder}
        scrolling={this.props.scrolling}
        disabled={this.props.disabled}
        fluid={this.props.fluid}
        options={this.props.options}
        value={this.state.value}
        floating
        className={cx("idseq-ui", this.props.rounded && "rounded")}
        onChange={this.handleOnChange.bind(this)}
        trigger={this.renderText()}
        selectOnBlur={false}
      />
    );
  }
}

Dropdown.propTypes = {
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  scrolling: PropTypes.bool,
  fluid: PropTypes.bool,
  rounded: PropTypes.bool,
  label: PropTypes.string,
  options: PropTypes.arrayOf(
    PropTypes.shape({
      text: PropTypes.string.isRequired,
      value: PropTypes.string.isRequired
    })
  ).isRequired,
  onChange: PropTypes.func.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number])
};

export default Dropdown;
