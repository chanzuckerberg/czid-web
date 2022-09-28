import { get } from "lodash/fp";
import React from "react";

import { trackEvent } from "~/api/analytics";
import BareDropdown from "~ui/controls/dropdowns/BareDropdown";

import { PrimaryButton, SecondaryButton } from "../buttons";
import ThresholdFilterList from "./ThresholdFilterList";
import DropdownLabel from "./common/DropdownLabel";
import DropdownTrigger from "./common/DropdownTrigger";
import cs from "./threshold_filter_dropdown.scss";

interface ThresholdFilterDropdownProps {
  disabled?: boolean;
  label?: string;
  thresholds?: unknown[];
  onApply?: $TSFixMeFunction;
  options?: object;
  disableMarginRight?: boolean;
  rounded?: boolean;
  placeholder?: string;
  useDropdownLabelCounter?: boolean;
}

class ThresholdFilterDropdown extends React.Component<
  ThresholdFilterDropdownProps
> {
  metrics: $TSFixMe;
  operators: $TSFixMe;
  constructor(props: $TSFixMe) {
    super(props);

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'targets' does not exist on type 'Readonl... Remove this comment to see the full error message
    this.metrics = (this.props.options || {}).targets || [];
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'operators' does not exist on type 'Readonl... Remove this comment to see the full error message
    this.operators = (this.props.options || {}).operators || [];

    this.state = {
      popupIsOpen: false,
      thresholds: [],
    };
  }

  static getDerivedStateFromProps(props: $TSFixMe, state: $TSFixMe) {
    const newThresholds = props.thresholds.filter(
      ThresholdFilterDropdown.isThresholdValid,
    );
    if (
      !ThresholdFilterDropdown.areThresholdsFiltersEqual(
        newThresholds,
        state.oldThresholds,
      )
    ) {
      return {
        thresholds: newThresholds,
        oldThresholds: newThresholds,
      };
    }
    return null;
  }

  static areThresholdsFiltersEqual(tfs1: $TSFixMe, tfs2: $TSFixMe) {
    // this functions assumes that lists with the sames thresholds in different order are different
    if (typeof tfs1 !== typeof tfs2) return false;
    tfs1 = tfs1 || [];
    tfs2 = tfs2 || [];
    if (tfs1.length !== tfs2.length || typeof tfs1 !== typeof tfs2) {
      return false;
    }
    for (let i = 0; i < tfs1.length; i++) {
      const tf1 = tfs1[i];
      const tf2 = tfs2[i];
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

  handleThresholdRemove(thresholdIdx: $TSFixMe) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'thresholds' does not exist on type 'Read... Remove this comment to see the full error message
    const newThresholds = [...this.state.thresholds];
    newThresholds.splice(thresholdIdx, 1);

    this.setState({ thresholds: newThresholds });
  }

  handleThresholdChange(thresholdIdx: $TSFixMe, threshold: $TSFixMe) {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'thresholds' does not exist on type 'Read... Remove this comment to see the full error message
    const newThresholds = [...this.state.thresholds];
    newThresholds[thresholdIdx] = threshold;

    this.setState({ thresholds: newThresholds });
  }

  static isThresholdValid(threshold: $TSFixMe) {
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
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'thresholds' does not exist on type 'Read... Remove this comment to see the full error message
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

  handleAddThresholdItem() {
    this.addNewItem();
  }

  applyFilterUpdates = () => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'thresholds' does not exist on type 'Read... Remove this comment to see the full error message
    const newThresholds = this.state.thresholds.filter(
      ThresholdFilterDropdown.isThresholdValid,
    );

    this.setState({ popupIsOpen: false, thresholds: newThresholds });
    this.props.onApply(newThresholds);

    trackEvent("ThresholdFilterDropdown_apply-button_clicked", {
      thresholds: newThresholds.length,
    });
  };

  cancelFilterUpdates = () => {
    this.setState({ popupIsOpen: false, thresholds: this.props.thresholds });
    trackEvent("ThresholdFilterDropdown_cancel-button_clicked", {
      thresholds: this.props.thresholds.length,
    });
  };

  handleOpen = () => {
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'thresholds' does not exist on type 'Read... Remove this comment to see the full error message
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
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'thresholds' does not exist on type 'Read... Remove this comment to see the full error message
    const { thresholds } = this.state;
    return (
      <BareDropdown
        trigger={this.renderLabel()}
        floating
        fluid
        arrowInsideTrigger
        className={cs.thresholdFilterDropdown}
        onOpen={this.handleOpen}
        onClose={(e: $TSFixMe) => {
          const enterPressed = get("key", e) === "Enter";
          if (enterPressed) {
            this.applyFilterUpdates();
          } else {
            this.cancelFilterUpdates();
          }
        }}
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'popupIsOpen' does not exist on type 'Rea... Remove this comment to see the full error message
        open={this.state.popupIsOpen}
        closeOnClick={false}
        disabled={disabled}
      >
        <div className={cs.container}>
          <ThresholdFilterList
            metrics={this.metrics}
            operators={this.operators}
            thresholds={thresholds}
            onChangeThreshold={(idx: $TSFixMe, threshold: $TSFixMe) =>
              this.handleThresholdChange(idx, threshold)
            }
            onRemoveThreshold={(idx: $TSFixMe) => {
              this.handleThresholdRemove(idx);
            }}
            // @ts-expect-error Type '(event: $TSFixMe) => void' is not assignable to type '() => void'
            onAddThreshold={(event: $TSFixMe) => {
              // @ts-expect-error ts-migrate(2554) FIXME: Expected 0 arguments, but got 1.
              this.handleAddThresholdItem(event);
            }}
          />
          <div className={cs.thresholdButtons}>
            <SecondaryButton
              text="Cancel"
              onClick={this.cancelFilterUpdates}
              className={cs.button}
            />
            <PrimaryButton
              text="Apply"
              onClick={this.applyFilterUpdates}
              className={cs.button}
            />
          </div>
        </div>
      </BareDropdown>
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
ThresholdFilterDropdown.defaultProps = {
  label: "Threshold filters",
  placeholder: null,
  rounded: true,
  thresholds: [],
  useDropdownLabelCounter: true,
};

export default ThresholdFilterDropdown;
