import React from 'react';
import { Dropdown } from 'semantic-ui-react'

class LabeledDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.passedOnChange = this.props.onChange;
  }

  onChange (e, d) {
    this.passedOnChange && this.passedOnChange(e, d);
  }

  renderText () {
    let label;
    for (let opt of this.props.options) {
      if (opt.value == this.props.value) {
        label = opt.text;
        break;
      }
    }
    return (
      <span><b>{this.props.label}</b> {label}</span>
    );
  }
  render () {
    return (
      <Dropdown {...this.props} onChange={this.onChange.bind(this)} text={this.renderText()} />
    );
  }
}
export default LabeledDropdown;
