import { Dropdown, Grid, Input, Label, Popup } from "semantic-ui-react";
import { forbidExtraProps } from "airbnb-prop-types";
import PrimaryButton from "../buttons/PrimaryButton";
import PropTypes from "prop-types";
import RemoveIcon from "../../icons/RemoveIcon";
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

  static getDerivedStateFromProps(props, state) {
    let newThresholds = props.thresholds.filter(
      ThresholdFilterDropdown.isThresholdValid
    );
    if (newThresholds !== state.thresholds) {
      return { thresholds: newThresholds };
    }
    return null;
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

  static isThresholdValid(threshold) {
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

  handleAddThresholdItem(event) {
    this.addNewItem();
    event.stopPropagation();
  }

  handleApply() {
    this.handleClose();
  }

  handleClose() {
    this.setState({ popupIsOpen: false });
    let newThresholds = this.state.thresholds.filter(this.isThresholdValid);
    this.setState({ thresholds: newThresholds });
    this.props.onApply(newThresholds);
  }

  handleOpen() {
    if (!this.state.thresholds.length) {
      this.addNewItem();
    }
    this.setState({ popupIsOpen: true });
  }

  render() {
    return (
      <Popup
        trigger={
          <ThresholdFilterDropdownLabel
            popupIsOpen={this.state.popupIsOpen}
            disabled={this.props.disabled}
            label={this.label}
            count={this.state.thresholds.length}
          />
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
              <Grid.Row className="threshold-actions">
                <Grid.Column>
                  <div
                    className="add-threshold-link"
                    onClick={this.handleAddThresholdItem.bind(this)}
                  >
                    + Add a threshold
                  </div>
                </Grid.Column>
              </Grid.Row>
              <Grid.Row className="threshold-buttons">
                <Grid.Column>
                  <PrimaryButton
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

ThresholdFilterDropdown.defaultProps = {
  thresholds: []
};

ThresholdFilterDropdown.propTypes = forbidExtraProps({
  disabled: PropTypes.bool,
  label: PropTypes.string,
  thresholds: PropTypes.array,
  onApply: PropTypes.func,
  options: PropTypes.object
});

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
          className="idseq-ui threshold inner-dropdown"
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
          className="idseq-ui threshold inner-dropdown"
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
        <div onClick={onRemove}>
          <RemoveIcon />
        </div>
      </Grid.Column>
    </Grid.Row>
  );
};

ThresholdFilter.propTypes = forbidExtraProps({
  metrics: PropTypes.array,
  onChange: PropTypes.func,
  onRemove: PropTypes.func,
  operators: PropTypes.array,
  threshold: PropTypes.object
});

const ThresholdFilterDropdownLabel = props => {
  let { disabled, label, popupIsOpen, count, ...extraProps } = props;
  const dropdownClasses = `idseq-ui ui dropdown threshold${
    popupIsOpen ? " active" : " "
  }${disabled ? " disabled" : " "}`;
  return (
    <div className={dropdownClasses} {...extraProps}>
      <div className="label-container">
        <div className="label-container-title">{label}</div>
        {count > 0 && <Label className="label-container-count">{count}</Label>}
      </div>
      <i className="dropdown handle icon" />
    </div>
  );
};

ThresholdFilterDropdownLabel.propType = forbidExtraProps({
  disabled: PropTypes.bool,
  label: PropTypes.string,
  popupIsOpen: PropTypes.bool,
  count: PropTypes.number
});

export default ThresholdFilterDropdown;
