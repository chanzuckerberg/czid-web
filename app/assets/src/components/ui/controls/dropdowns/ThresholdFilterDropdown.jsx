import { Grid } from "semantic-ui-react";
import { forbidExtraProps } from "airbnb-prop-types";
import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import Input from "~/components/ui/controls/Input";
import PropTypes from "prop-types";
import RemoveIcon from "../../icons/RemoveIcon";
import DropdownTrigger from "./common/DropdownTrigger";
import DropdownLabel from "./common/DropdownLabel";
import cs from "./threshold_filter_dropdown.scss";
import React from "react";

class ThresholdFilterDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.metrics = (this.props.options || {}).targets || [];
    this.operators = (this.props.options || {}).operators || [];
    this.label = this.props.label || "Threshold Filters";

    this.state = {
      popupIsOpen: false,
      thresholds: []
    };
  }

  static getDerivedStateFromProps(props, state) {
    let newThresholds = props.thresholds.filter(
      ThresholdFilterDropdown.isThresholdValid
    );
    if (
      !ThresholdFilterDropdown.areThresholdsFiltersEqual(
        newThresholds,
        state.oldThresholds
      )
    ) {
      return {
        thresholds: newThresholds,
        oldThresholds: newThresholds
      };
    }
    return null;
  }

  static areThresholdsFiltersEqual(tfs1, tfs2) {
    // this functions assumes that lists with the sames thresholds in different order are different
    if (typeof tfs1 !== typeof tfs2) return false;
    tfs1 = tfs1 || [];
    tfs2 = tfs2 || [];
    if (tfs1.length != tfs2.length || typeof tfs1 !== typeof tfs2) {
      return false;
    }
    for (let i = 0; i < tfs1.length; i++) {
      let tf1 = tfs1[i];
      let tf2 = tfs2[i];
      if (
        tf1.metric !== tf2.metric ||
        tf1.operator !== tf2.operator ||
        tf1.value !== tf2.value
      ) {
        return false;
      }
    }
    return true;
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

  handleClose = shouldApply => {
    this.setState({ popupIsOpen: false });

    if (shouldApply) {
      let newThresholds = this.state.thresholds.filter(
        ThresholdFilterDropdown.isThresholdValid
      );
      this.setState({ thresholds: newThresholds });
      this.props.onApply(newThresholds);
    } else {
      this.setState({ thresholds: this.props.thresholds });
    }
  };

  handleOpen = () => {
    if (!this.state.thresholds.length) {
      this.addNewItem();
    }
    this.setState({ popupIsOpen: true });
  };

  renderLabel() {
    const label = this.props.thresholds.length > 0 && (
      <DropdownLabel
        className={cs.dropdownLabel}
        disabled={this.props.disabled}
        text={String(this.props.thresholds.length)}
      />
    );

    const labelText =
      this.label && this.props.thresholds.length > 0
        ? this.label + ":"
        : this.label;

    return (
      <DropdownTrigger
        className={cs.dropdownTrigger}
        label={labelText}
        value={label}
        rounded
      />
    );
  }

  render() {
    return (
      <BareDropdown
        trigger={this.renderLabel()}
        floating
        fluid
        arrowInsideTrigger
        className={cs.thresholdFilterDropdown}
        onOpen={this.handleOpen}
        onClose={() => this.handleClose(false)}
        open={this.state.popupIsOpen}
        closeOnClick={false}
      >
        <div className={cs.container}>
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
            <Grid.Row className={cs.thresholdActions}>
              <Grid.Column>
                <span
                  className={cs.addThresholdLink}
                  onClick={this.handleAddThresholdItem.bind(this)}
                >
                  + Add a threshold
                </span>
              </Grid.Column>
            </Grid.Row>
            <Grid.Row className={cs.thresholdButtons}>
              <Grid.Column>
                <SecondaryButton
                  text="Cancel"
                  onClick={() => this.handleClose(false)}
                  className={cs.button}
                />
                <PrimaryButton
                  text="Apply"
                  onClick={() => this.handleClose(true)}
                  className={cs.button}
                />
              </Grid.Column>
            </Grid.Row>
          </Grid>
        </div>
      </BareDropdown>
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
  let { metric, value, operator } = threshold;

  const handleMetricChange = newMetric => {
    onChange({ metric: newMetric, value, operator });
  };

  const handleOperatorChange = newOperator => {
    onChange({ metric, value, operator: newOperator });
  };

  const handleValueChange = newValue => {
    onChange({ metric, value: newValue, operator });
  };

  return (
    <Grid.Row className={cs.thresholdFilter}>
      <Grid.Column width={9}>
        <Dropdown
          placeholder="Metric"
          fluid
          floating
          scrolling
          options={metrics}
          onChange={handleMetricChange}
          value={metric}
        />
      </Grid.Column>
      <Grid.Column>
        <Dropdown
          placeholder="Op."
          fluid
          floating
          scrolling
          options={operators.map(option => ({ text: option, value: option }))}
          onChange={handleOperatorChange}
          value={operator}
        />
      </Grid.Column>
      <Grid.Column>
        <Input type="number" onChange={handleValueChange} value={value} />
      </Grid.Column>
      <Grid.Column width={1}>
        <div onClick={onRemove} className={cs.removeIcon}>
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

ThresholdFilterDropdown.defaultProps = {
  thresholds: []
};

export default ThresholdFilterDropdown;
