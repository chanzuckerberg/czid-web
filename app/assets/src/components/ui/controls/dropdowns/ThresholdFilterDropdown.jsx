import { forbidExtraProps } from "airbnb-prop-types";
import { get, find } from "lodash/fp";
import PropTypes from "prop-types";
import React from "react";
import { Grid } from "semantic-ui-react";

import { logAnalyticsEvent } from "~/api/analytics";
import Input from "~/components/ui/controls/Input";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";
import Dropdown from "~ui/controls/dropdowns/Dropdown";
import { IconCloseSmall } from "~ui/icons";

import PrimaryButton from "../buttons/PrimaryButton";
import SecondaryButton from "../buttons/SecondaryButton";
import DropdownLabel from "./common/DropdownLabel";
import DropdownTrigger from "./common/DropdownTrigger";
import cs from "./threshold_filter_dropdown.scss";

class ThresholdFilterDropdown extends React.Component {
  constructor(props) {
    super(props);

    this.metrics = (this.props.options || {}).targets || [];
    this.operators = (this.props.options || {}).operators || [];

    this.state = {
      popupIsOpen: false,
      thresholds: [],
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
        oldThresholds: newThresholds,
      };
    }
    return null;
  }

  static areThresholdsFiltersEqual(tfs1, tfs2) {
    // this functions assumes that lists with the sames thresholds in different order are different
    if (typeof tfs1 !== typeof tfs2) return false;
    tfs1 = tfs1 || [];
    tfs2 = tfs2 || [];
    if (tfs1.length !== tfs2.length || typeof tfs1 !== typeof tfs2) {
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
      threshold.value !== "" &&
      !Number.isNaN(threshold.value)
    );
  }

  addNewItem() {
    this.setState({
      thresholds: [
        ...this.state.thresholds,
        {
          metric: this.metrics[0].value,
          metricDisplay: this.metrics[0].text,
          operator: this.operators[0],
          value: "",
        },
      ],
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

      logAnalyticsEvent("ThresholdFilterDropdown_apply-button_clicked", {
        thresholds: newThresholds.length,
      });
    } else {
      this.setState({ thresholds: this.props.thresholds });
      logAnalyticsEvent("ThresholdFilterDropdown_cancel-button_clicked", {
        thresholds: this.props.thresholds.length,
      });
    }
  };

  handleOpen = () => {
    if (!this.state.thresholds.length) {
      this.addNewItem();
    }
    this.setState({ popupIsOpen: true });
  };

  renderLabel() {
    const {
      disabled,
      disableMarginRight,
      label,
      placeholder,
      rounded,
      thresholds,
      useDropdownLabelCounter,
    } = this.props;

    const labelCounter = thresholds.length > 0 && (
      <DropdownLabel
        className={cs.dropdownLabel}
        disabled={disabled}
        text={String(thresholds.length)}
        disableMarginRight={disableMarginRight}
      />
    );

    const labelText = label && thresholds.length > 0 ? label + ":" : label;

    const numSelectedText =
      !useDropdownLabelCounter && thresholds.length > 0
        ? `${String(thresholds.length)} selected`
        : null;

    return (
      <DropdownTrigger
        className={cs.dropdownTrigger}
        disabled={disabled}
        label={labelText}
        placeholder={placeholder}
        rounded={rounded}
        value={useDropdownLabelCounter ? labelCounter : numSelectedText}
      />
    );
  }

  render() {
    const { disabled } = this.props;
    return (
      <BareDropdown
        trigger={this.renderLabel()}
        floating
        fluid
        arrowInsideTrigger
        className={cs.thresholdFilterDropdown}
        onOpen={this.handleOpen}
        onClose={e => {
          // shouldApply on 'Enter'
          this.handleClose(get("key", e) === "Enter");
        }}
        open={this.state.popupIsOpen}
        closeOnClick={false}
        disabled={disabled}
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
  label: "Threshold filters",
  placeholder: null,
  rounded: true,
  thresholds: [],
  useDropdownLabelCounter: true,
};

ThresholdFilterDropdown.propTypes = forbidExtraProps({
  disabled: PropTypes.bool,
  label: PropTypes.string,
  thresholds: PropTypes.array,
  onApply: PropTypes.func,
  options: PropTypes.object,
  disableMarginRight: PropTypes.bool,
  rounded: PropTypes.bool,
  placeholder: PropTypes.string,
  useDropdownLabelCounter: PropTypes.bool,

  // TODO: Refactor ThresholdFilterDropdown to be compatible with PortalDropdown,
  // so we can use usePortal and withinModal
});

const ThresholdFilter = ({
  threshold,
  metrics,
  operators,
  onChange,
  onRemove,
}) => {
  let { metric, value, operator, metricDisplay } = threshold;

  const handleMetricChange = newMetric => {
    const newMetricDisplay = get("text", find(["value", newMetric], metrics));
    onChange({
      metric: newMetric,
      value,
      operator,
      metricDisplay: newMetricDisplay,
    });
  };

  const handleOperatorChange = newOperator => {
    onChange({ metric, value, operator: newOperator, metricDisplay });
  };

  const handleValueChange = newValue => {
    onChange({ metric, value: newValue, operator, metricDisplay });
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
          <IconCloseSmall />
        </div>
      </Grid.Column>
    </Grid.Row>
  );
};

ThresholdFilter.propTypes = forbidExtraProps({
  metrics: PropTypes.arrayOf(
    PropTypes.shape({
      metric: PropTypes.string,
      value: PropTypes.string,
      operator: PropTypes.string,
      metricDisplay: PropTypes.string,
    })
  ),
  onChange: PropTypes.func,
  onRemove: PropTypes.func,
  operators: PropTypes.array,
  threshold: PropTypes.object,
});

export default ThresholdFilterDropdown;
