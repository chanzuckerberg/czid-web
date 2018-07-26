import React from "react";
import { Dropdown as BaseDropdown } from "semantic-ui-react";

class Dropdown extends React.Component {
  constructor(props) {
    super(props);
    this.passedOnChange = this.props.onChange;
    this.state = { value: this.props.value };
    this.labels = this.props.options.reduce((labelMap, option) => {
      labelMap[option.value.toString()] = option.text;
      return labelMap;
    }, {});
  }

  onChange(e, d) {
    this.setState({ value: d.value });
    this.passedOnChange && this.passedOnChange(e, d);
  }

  renderText() {
    return (
      <div>
        <span className="label-title">{this.props.label}</span>{" "}
        {this.state.value ? this.labels[this.state.value.toString()] : ""}
      </div>
    );
  }
  render() {
    return (
      <BaseDropdown
        {...this.props}
        floating
        className="base"
        onChange={this.onChange.bind(this)}
        trigger={this.renderText()}
      />
    );
  }
}
export default Dropdown;
