/* N.B. TODO -- this component is a modified subset of the existing TaxonThresholdFilter component. Because the button styles / handlers and state management for the TaxonThresholdFilter component are pretty tailored for the unique combination of the taxon search based filter + the threshold filters, we can't just pop this in as a subcomponent. In the future, we might want to consider how we can improve this component to be more reusable.
 */

import { Button, DropdownPopper, InputDropdown } from "czifui";
import { find, isEmpty, some } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { ThresholdFilterList } from "~/components/ui/controls/dropdowns";
import {
  MetricOption,
  ThresholdFilterData,
  ThresholdFilterOperator,
} from "~/interface/dropdown";
import cs from "./threshold_filter_sds.scss";

interface ThresholdFilterSDSPropsType {
  selectedThresholds: ThresholdFilterData[];
  onApply: (thresholds: ThresholdFilterData[]) => void;
  isDisabled: boolean;
  metricOptions: MetricOption[];
}

export const ThresholdFilterSDS = ({
  selectedThresholds,
  onApply,
  metricOptions,
  isDisabled,
}: ThresholdFilterSDSPropsType) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hasModifiedFilters, setHasModifiedFilters] = useState<boolean>(false);
  // Threshold selections are only stored in this component's state until they
  // are applied, at which point they are passed to the parent component via callback
  const [thresholds, setThresholds] = useState<ThresholdFilterData[]>(
    selectedThresholds,
  );

  const filterOperators: ThresholdFilterOperator[] = [">=", "<="];

  useEffect(() => {
    setThresholds(selectedThresholds);
  }, [selectedThresholds]);

  const handleCancel = () => {
    setAnchorEl(null);
    setThresholds(selectedThresholds);
  };

  const handleThresholdChange = (
    thresholdIdx: number,
    threshold: ThresholdFilterData,
  ) => {
    const newThresholds = [
      ...thresholds.slice(0, thresholdIdx),
      threshold,
      ...thresholds.slice(thresholdIdx + 1, thresholds.length),
    ];

    setHasModifiedFilters(checkIfThresholdFiltersWereModified(newThresholds));
    setThresholds(newThresholds);
  };

  const handleThresholdRemove = (thresholdIdx: number) => {
    const newThresholds = [
      ...thresholds.slice(0, thresholdIdx),
      ...thresholds.slice(thresholdIdx + 1, thresholds.length),
    ];

    setHasModifiedFilters(checkIfThresholdFiltersWereModified(newThresholds));
    setThresholds(newThresholds);
  };

  const handleAddThresholdItem = () => {
    const firstMetric = metricOptions[0];

    setThresholds((existingThresholds: ThresholdFilterData[]) => [
      ...(Array.isArray(existingThresholds) ? existingThresholds : []),
      {
        metric: firstMetric.value,
        metricDisplay: firstMetric.text,
        operator: filterOperators[0],
        value: "",
      },
    ]);
  };

  const handleApply = () => {
    setAnchorEl(null);
    onApply(thresholds);
  };

  // If any of the newThresholds were not found in the existing selected thresholds, then the threshold filters were modified
  const checkIfThresholdFiltersWereModified = (
    newThresholds: ThresholdFilterData[],
  ) => {
    const wereThresholdsModifiedOrAdded = some(
      (newThreshold: ThresholdFilterData) =>
        !isEmpty(newThreshold.value) &&
        find(newThreshold, selectedThresholds) === undefined,
      newThresholds,
    );

    const wereThresholdsRemoved = some(
      (selectedThreshold: ThresholdFilterData) =>
        find(selectedThreshold, newThresholds) === undefined,
      selectedThresholds,
    );

    return wereThresholdsModifiedOrAdded || wereThresholdsRemoved;
  };

  const handleDropdownInputClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
    if (!thresholds) {
      handleAddThresholdItem();
    }
  };

  return (
    <>
      <InputDropdown
        disabled={isDisabled}
        onClick={handleDropdownInputClick}
        label="Thresholds"
        sdsStyle="minimal"
        sdsStage="default"
      />
      <DropdownPopper
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        placement="bottom-start"
      >
        <div className={cs.filterContainer}>
          <div className={cs.title}>Configure Thresholds</div>

          <ThresholdFilterList
            metrics={metricOptions}
            operators={filterOperators}
            thresholds={thresholds}
            onChangeThreshold={(idx, threshold) => {
              handleThresholdChange(idx, threshold);
            }}
            onRemoveThreshold={idx => {
              handleThresholdRemove(idx);
            }}
            onAddThreshold={handleAddThresholdItem}
          />

          <div className={cs.actions}>
            <div className={cs.action}>
              <Button
                sdsStyle="square"
                sdsType="primary"
                disabled={!hasModifiedFilters}
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
            <div className={cs.action}>
              <Button
                sdsStyle="square"
                sdsType="secondary"
                onClick={handleCancel}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      </DropdownPopper>
    </>
  );
};
