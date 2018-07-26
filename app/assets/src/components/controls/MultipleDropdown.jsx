import React from "react";
import { Dropdown as BaseDropdown, Label } from "semantic-ui-react";

class MultipleDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.passedOnChange = this.props.onChange;

    this.state = {
      value: this.props.value || []
    };
  }

  optionClicked(e, d) {
    console.log(d.value);
    e.stopPropagation();
    let value = this.state.value.slice();
    let idx = value.indexOf(d["data-value"]);
    if (idx > -1) {
      value.splice(idx, 1);
    } else {
      value.push(d["data-value"]);
    }
    this.passedOnChange && this.passedOnChange(e, value);
    this.setState({ value: value });
  }

  renderMenuItems() {
    let ret = [];
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
              checked={this.state.value.indexOf(option.value) > -1}
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
      <div>
        <div className="label-title">{this.props.label}</div>
        <Label>{this.state.value.length}</Label>
      </div>
    );
  }

  render() {
    return (
      <BaseDropdown
        floating
        className="multiple"
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
export default MultipleDropdown;
