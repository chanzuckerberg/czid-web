import React from 'react';
import { Dropdown, Label } from 'semantic-ui-react'

class LabeledFilterDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.passedOnChange = this.props.onChange;
  }

  optionClicked (e,d) {
    e.stopPropagation();
    let idx = this.props.value.indexOf(d['data-value']);
    let value = this.props.value.slice();
    if (idx > -1) {
      value.splice(idx, 1);
    } else {
      value.push(d['data-value']);
    }
    this.passedOnChange && this.passedOnChange(e, value);
  }

  renderMenuItems () {
    let ret = [];
    for (let option of this.props.options) {
      ret.push(
        <Dropdown.Item key={option.value} data-value={option.value} onClick={this.optionClicked.bind(this)}>
          <span className="text">
            <input type="checkbox" checked={this.props.value.indexOf(option.value) > -1} readOnly/>
            {option.text}
          </span>
        </Dropdown.Item>
      )
    }
    return ret;
  }

  renderText () {
    return (
      <span><b>{this.props.label}</b> <Label color='blue'>{this.props.value.length}</Label></span>
    );
  }

  render () {
    return (
      <Dropdown className="labeled-filter-dropdown" {...this.props} options={undefined} value={undefined} text={this.renderText()}>
        <Dropdown.Menu>
          {this.renderMenuItems()}
        </Dropdown.Menu>
      </Dropdown>
    );
  }
}
export default LabeledFilterDropdown;
