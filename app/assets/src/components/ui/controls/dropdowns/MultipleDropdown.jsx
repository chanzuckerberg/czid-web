import { Dropdown as BaseDropdown, Label } from "semantic-ui-react";
import PropTypes from "prop-types";
import React from "react";

class MultipleDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.passedOnChange = this.props.onChange;

    this.state = {
      value: this.props.value || []
    };
  }

  optionClicked(e, d) {
    e.stopPropagation();
    let value = this.state.value.slice();
    let idx = value.indexOf(d["data-value"]);
    if (idx > -1) {
      value.splice(idx, 1);
    } else {
      value.push(d["data-value"]);
    }
    this.setState({ value });
    this.passedOnChange && this.passedOnChange(e, value);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.state.value) {
      this.setState({ value: nextProps.value });
    }
  }

  renderMenuItems() {
    let ret = [];
    let checkedOptions = this.props.value || this.state.value;
    for (let option of this.props.options) {
      ret.push(
        <BaseDropdown.Item
          key={option.value}
          data-value={option.value}
          onClick={this.optionClicked.bind(this)}
        >
          <span className="text">
            <input
              type="checkbox"
              checked={checkedOptions.indexOf(option.value) > -1}
              readOnly
            />
            {option.text}
          </span>
        </BaseDropdown.Item>
      );
    }
    return ret;
  }

  renderText() {
    return (
      <div className="label-container">
        <div className="label-container-title">{this.props.label}</div>
        {this.state.value.length > 0 && (
          <Label className="label-container-count">
            {this.state.value.length}
          </Label>
        )}
      </div>
    );
  }

  render() {
    return (
      <BaseDropdown
        floating
        className="idseq-ui multiple"
        {...this.props}
        options={undefined}
        value={undefined}
        trigger={this.renderText()}
      >
        <BaseDropdown.Menu>{this.renderMenuItems()}</BaseDropdown.Menu>
      </BaseDropdown>
    );
  }
}

MultipleDropdown.propTypes = {
  label: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  options: PropTypes.arrayOf(PropTypes.object)
};

export default MultipleDropdown;
