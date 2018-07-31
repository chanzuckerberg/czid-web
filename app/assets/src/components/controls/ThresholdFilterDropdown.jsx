import {
  Button,
  Dropdown,
  Grid,
  Icon,
  Input,
  Label,
  Popup
} from "semantic-ui-react";
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";
import PropTypes from "prop-types";
import React from "react";

class ThresholdFilterDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.metrics = (this.props.options || {}).targets || [];
    this.operators = (this.props.options || {}).operators || [];
    this.label = this.props.label || "Threshold Filters:";

    this.state = {
      popupIsOpen: false,
      thresholds: []
    };
  }

  handleThresholdRemove(thresholdIdx) {
    var newThresholds = [...this.state.thresholds];
    newThresholds.splice(thresholdIdx, 1);
    this.setState({ thresholds: newThresholds });
  }

  handleThresholdChange(thresholdIdx, threshold) {
    var newThresholds = [...this.state.thresholds];
    newThresholds[thresholdIdx] = threshold;
    this.setState({ thresholds: newThresholds });
  }

  isThresholdValid(threshold) {
    return (
      threshold.metric.length > 0 &&
      threshold.operator.length > 0 &&
      threshold.value != "" &&
      !Number.isNaN(threshold.value)
    );
  }

  addNewItem() {
    this.setState({
      thresholds: [
        ...this.state.thresholds,
        {
          metric: this.metrics[0].value,
          operator: this.operators[0],
          value: ""
        }
      ]
    });
  }

  validateItems() {
    // let newThresholds = this.state.thresholds.filter(this.isThresholdValid);
    let newThresholds = this.state.thresholds.filter(this.isThresholdValid);
    this.setState({ thresholds: newThresholds });
    this.props.onApply(newThresholds);
  }

  handleAddThresholdItem(event) {
    this.addNewItem();
    event.stopPropagation();
  }

  handleApply() {
    this.handleClose();
  }

  handleClose() {
    this.setState({ popupIsOpen: false });
    this.validateItems();
  }

  handleOpen() {
    if (!this.state.thresholds.length) {
      this.addNewItem();
    }
    this.setState({ popupIsOpen: true });
  }

  render() {
    const dropdownClasses =
      "idseq-ui ui dropdown threshold" +
      (this.state.popupIsOpen ? " active" : " ") +
      (this.props.disabled ? " disabled" : " ");
    return (
      <Popup
        trigger={
          <div className={dropdownClasses}>
            <div className="label-title">{this.label}</div>
            <i className="dropdown handle icon" />
            <Label>{this.state.thresholds.length}</Label>
          </div>
        }
        content={
          <div className="container">
            <Grid verticalAlign="middle" columns="equal">
              {this.state.thresholds.map((threshold, idx) => (
                <ThresholdFilter
                  key={idx}
                  metrics={this.metrics}
                  operators={this.operators}
                  threshold={threshold}
                  onChange={threshold =>
                    this.handleThresholdChange(idx, threshold)
                  }
                  onRemove={() => {
                    this.handleThresholdRemove(idx);
                  }}
                />
              ))}
              <Grid.Row className="actions">
                <Grid.Column>
                  <PrimaryButton
                    text="Add Threshold"
                    onClick={this.handleAddThresholdItem.bind(this)}
                  />
                </Grid.Column>
                <Grid.Column>
                  <SecondaryButton
                    text="Apply"
                    onClick={this.handleApply.bind(this)}
                  />
                </Grid.Column>
              </Grid.Row>
            </Grid>
          </div>
        }
        basic
        className="idseq-ui threshold"
        onOpen={this.handleOpen.bind(this)}
        onClose={this.handleClose.bind(this)}
        open={this.state.popupIsOpen}
        position="bottom left"
        on="click"
      />
    );
  }
}

ThresholdFilterDropdown.propTypes = {
  disabled: PropTypes.bool,
  label: PropTypes.string,
  thresholds: PropTypes.array,
  onApply: PropTypes.func,
  options: PropTypes.object
};

const ThresholdFilter = ({
  threshold,
  metrics,
  operators,
  onChange,
  onRemove
}) => {
  const handleMetricChange = (_, metric) => {
    threshold.metric = metric.value;
    onChange(threshold);
  };

  const handleOperatorChange = (_, operator) => {
    threshold.operator = operator.value;
    onChange(threshold);
  };

  const handleValueChange = (_, value) => {
    threshold.value = value.value;
    onChange(threshold);
  };

  return (
    <Grid.Row className="filter">
      <Grid.Column width={9}>
        <Dropdown
          className="idseq-ui threshold"
          placeholder="Metric"
          fluid
          floating
          scrolling
          options={metrics}
          onChange={handleMetricChange.bind(this)}
          value={threshold.metric}
        />
      </Grid.Column>
      <Grid.Column>
        <Dropdown
          className="idseq-ui threshold"
          placeholder="Op."
          fluid
          floating
          scrolling
          options={operators.map(option => ({ text: option, value: option }))}
          onChange={handleOperatorChange}
          value={threshold.operator}
        />
      </Grid.Column>
      <Grid.Column>
        <Input
          fluid
          focus
          type="number"
          onChange={handleValueChange}
          value={threshold.value}
        />
      </Grid.Column>
      <Grid.Column width={1}>
        <Icon name="remove" onClick={onRemove} className="remove" />
      </Grid.Column>
    </Grid.Row>
  );
};

ThresholdFilter.propTypes = {
  metrics: PropTypes.array,
  onChange: PropTypes.func,
  onRemove: PropTypes.func,
  operators: PropTypes.array,
  threshold: PropTypes.object
};

export default ThresholdFilterDropdown;
