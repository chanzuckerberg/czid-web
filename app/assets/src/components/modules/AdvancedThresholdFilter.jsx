import React from "react";
import PropTypes from "prop-types";
import { Button, Dropdown, Icon, Input, Label, Popup } from "semantic-ui-react";
import ThresholdMap from "../utils/ThresholdMap";

class AdvancedThresholdFilterRow extends React.Component {
  constructor(props) {
    super(props);
    this.labelChanged = this.labelChanged.bind(this);
    this.operatorChanged = this.operatorChanged.bind(this);
    this.valueChanged = this.valueChanged.bind(this);
  }

  changed(data) {
    this.props.onChange(data);
  }

  labelChanged(e, data) {
    this.changed({
      label: data.value,
      operator: this.props.filter.operator,
      value: this.props.filter.value
    });
  }

  operatorChanged(e, data) {
    this.changed({
      label: this.props.filter.label,
      operator: data.value,
      value: this.props.filter.value
    });
  }

  valueChanged(e, data) {
    let newValue = data.value;
    if (newValue != "" && newValue != "-" && isNaN(parseFloat(newValue))) {
      newValue = this.props.filter.value;
    }
    this.changed({
      label: this.props.filter.label,
      operator: this.props.filter.operator,
      value: newValue
    });
  }

  renderLabelSelect() {
    let opts = this.props.labels.map(label => {
      return {
        text: label.name,
        value: label.value
      };
    });

    return (
      <Dropdown
        fluid
        onChange={this.labelChanged}
        value={this.props.filter.label}
        options={opts}
      />
    );
  }

  renderOperatorSelect() {
    let opts = this.props.operators.map(label => {
      return {
        text: label,
        value: label
      };
    });

    return (
      <Dropdown
        fluid
        onChange={this.operatorChanged}
        value={this.props.filter.operator}
        options={opts}
      />
    );
  }

  renderValue() {
    return (
      <Input
        fluid
        value={this.props.filter.value}
        onChange={this.valueChanged}
      />
    );
  }

  renderRemove() {
    return (
      <Icon
        name="remove"
        onClick={this.props.onRemove}
        className="remove-button"
      />
    );
  }

  render() {
    return (
      <div className="advanced-threshold-filter-row">
        <div className="row">
          <div className="col s5">{this.renderLabelSelect()}</div>
          <div className="col s3">{this.renderOperatorSelect()}</div>
          <div className="col s3">{this.renderValue()}</div>
          <div className="col s1">{this.renderRemove()}</div>
        </div>
      </div>
    );
  }
}

class AdvancedThresholdFilter extends React.Component {
  constructor(props) {
    super(props);

    let filters = this.props.filters;
    if (!(filters && filters.length > 0)) {
      filters = [this.makeRow()];
      this.props.onChange(filters);
    }

    this.state = {
      filters: filters
    };
    this.addRow = this.addRow.bind(this);
    this.applyClicked = this.applyClicked.bind(this);
  }

  applyClicked() {
    this.props.onApply(this.state.filters);
  }

  makeRow() {
    return {
      label: this.props.labels[0].value,
      operator: this.props.operators[0],
      value: ""
    };
  }

  addRow() {
    this.state.filters.push(this.makeRow());
    this.setState({ filters: this.state.filters });
    this.props.onChange(this.state.filters);
  }

  rowChanged(data, i) {
    this.state.filters[i] = data;
    this.setState({ filters: this.state.filters });
    this.props.onChange(this.state.filters);
  }

  removeRow(i) {
    this.state.filters.splice(i, 1);
    this.setState({ filters: this.state.filters });
    this.props.onChange(this.state.filters);
  }

  renderFilterRows() {
    return this.state.filters.map((filter, i) => {
      return (
        <AdvancedThresholdFilterRow
          labels={this.props.labels}
          operators={this.props.operators}
          filter={filter}
          onChange={data => {
            this.rowChanged(data, i);
          }}
          onRemove={() => {
            this.removeRow(i);
          }}
          key={i}
        />
      );
    });
  }
  render() {
    return (
      <div className="advanced-threshold-filter">
        <div className="rows">{this.renderFilterRows()}</div>
        <div className="row">
          <div className="actions col s12">
            <Button secondary onClick={this.addRow}>
              Add threshold
            </Button>
            <Button primary onClick={this.applyClicked}>
              Apply
            </Button>
          </div>
        </div>
      </div>
    );
  }
}

AdvancedThresholdFilter.propTypes = {
  labels: PropTypes.array.isRequired,
  operators: PropTypes.array.isRequired,
  filters: PropTypes.array
};

class AdvancedThresholdFilterDropdown extends React.Component {
  static get defaultProps() {
    return {
      label: "Advanced Options:"
    };
  }

  constructor(props) {
    super(props);
    this.applyOnHide = this.props.applyOnHide;
  }
  onThresholdsChanged(filters) {
    this.props.onChange(filters);
  }

  onClose() {
    if (this.props.applyOnHide) {
      this.refs.advancedThresholdFilter.applyClicked();
    }
  }

  render() {
    let validFilters = [];
    for (let filter of this.props.filters) {
      if (ThresholdMap.isThresholdValid(filter)) {
        validFilters.push(filter);
      }
    }
    return (
      <Popup
        trigger={
          <Dropdown
            fluid={this.props.fluid}
            className="active-threshold-filter-dropdown"
            trigger={
              <span>
                <b>{this.props.label}</b> <Label>{validFilters.length}</Label>
              </span>
            }
            open={false}
            disabled={this.props.disabled}
          />
        }
        on="click"
        position="bottom right"
        hideOnScroll={true}
        onClose={this.onClose.bind(this)}
      >
        <AdvancedThresholdFilter
          ref="advancedThresholdFilter"
          {...this.props}
          filters={this.props.filters}
          onChange={this.onThresholdsChanged.bind(this)}
        />
      </Popup>
    );
  }
}
AdvancedThresholdFilterDropdown.propTypes = {
  labels: PropTypes.array.isRequired,
  operators: PropTypes.array.isRequired,
  filters: PropTypes.array,
  onChange: PropTypes.func,
  onApply: PropTypes.func,
  applyOnHide: PropTypes.bool
};

export default AdvancedThresholdFilterDropdown;
