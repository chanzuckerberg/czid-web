/* Note: this is a minor variant of the ThresholdDropdown component, specifically for the Taxon Heatmap. Most notably, it swaps out the button with an SDS `InputDropdown` and re-implements the popover with the MUI component per the design spec for the left side filters. I spent a lot of time working on a refactor of the original so I could modularly swap out just the button, and made some good progress which I'll push to a separate branch. However, doing this while also trying to keep all changes behind a feature flag ended up being a huge time sink and I dont' want to block the taxon heatmap filters release.
 Once we're ready to update the filters on other pages in the app we can make a switch. - SMB 2023-03 */

import React from "react";

import { trackEvent } from "~/api/analytics";

import PopoverMinimalButton from "~/components/ui/controls/PopoverMinimalButton";
import {
  PrimaryButton,
  SecondaryButton,
} from "~/components/ui/controls/buttons";
import ThresholdFilterList from "~/components/ui/controls/dropdowns/ThresholdFilterList";
import cs from "./samples_heatmap_threshold_dropdown.scss";

interface SamplesHeatmapThresholdDropdownProps {
  disabled?: boolean;
  label?: string;
  thresholds?: $TSFixMe[];
  onApply?: $TSFixMeFunction;
  options?: object;
  disableMarginRight?: boolean;
  rounded?: boolean;
  placeholder?: string;
  useDropdownLabelCounter?: boolean;
}

interface SamplesHeatmapThresholdDropdownState {
  popupIsOpen: boolean;
  thresholds: $TSFixMe[];
}

export class SamplesHeatmapThresholdDropdown extends React.Component<
  SamplesHeatmapThresholdDropdownProps,
  SamplesHeatmapThresholdDropdownState
> {
  metrics: $TSFixMe;
  operators: $TSFixMe;
  constructor(props: SamplesHeatmapThresholdDropdownProps) {
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
      SamplesHeatmapThresholdDropdown.isThresholdValid,
    );
    if (
      !SamplesHeatmapThresholdDropdown.areThresholdsFiltersEqual(
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
    const newThresholds = [...this.state.thresholds];
    newThresholds.splice(thresholdIdx, 1);

    this.setState({ thresholds: newThresholds });
  }

  handleThresholdChange(thresholdIdx: $TSFixMe, threshold: $TSFixMe) {
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
    const newThresholds = this.state.thresholds.filter(
      SamplesHeatmapThresholdDropdown.isThresholdValid,
    );

    this.setState({ popupIsOpen: false, thresholds: newThresholds });
    this.props.onApply(newThresholds);

    trackEvent("ThresholdDropdown_apply-button_clicked", {
      thresholds: newThresholds.length,
    });
  };

  cancelFilterUpdates = () => {
    this.setState({ popupIsOpen: false, thresholds: this.props.thresholds });
    trackEvent("ThresholdDropdown_cancel-button_clicked", {
      thresholds: this.props.thresholds.length,
    });
  };

  handleOpen = () => {
    if (!this.state.thresholds.length) {
      this.addNewItem();
    }
    this.setState({ popupIsOpen: true });
  };

  render() {
    const { disabled } = this.props;
    const { thresholds } = this.state;
    return (
      <PopoverMinimalButton
        disabled={disabled}
        label={"Threshold Filters"}
        details={this.state.thresholds.length.toString()}
        content={
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
        }
      />
    );
  }
}

// @ts-expect-error ts-migrate(2339) FIXME: Property 'defaultProps' does not exist on type 'ty... Remove this comment to see the full error message
SamplesHeatmapThresholdDropdown.defaultProps = {
  label: "Threshold filters",
  placeholder: null,
  rounded: true,
  thresholds: [],
  useDropdownLabelCounter: true,
};