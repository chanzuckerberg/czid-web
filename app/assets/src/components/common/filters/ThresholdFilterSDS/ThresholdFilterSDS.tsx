/* N.B. TODO -- this component is a modified subset of the existing TaxonThresholdFilter component. Because the button styles / handlers and state management for the TaxonThresholdFilter component are pretty tailored for the unique combination of the taxon search based filter + the threshold filters, we can't just pop this in as a subcomponent. In the future, we might want to consider how we can improve this component to be more reusable.
 */

import { Button, DropdownPopper, InputDropdown } from "@czi-sds/components";
import { find, isEmpty, some } from "lodash/fp";
import React, { useState } from "react";
import ThresholdFilterTag from "~/components/common/ThresholdFilterTag";
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
  disabled: boolean;
  metricOptions: MetricOption[];
  shouldShowTags?: boolean;
}

export const ThresholdFilterSDS = ({
  selectedThresholds,
  onApply,
  metricOptions,
  disabled,
  shouldShowTags = true,
}: ThresholdFilterSDSPropsType) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hasModifiedFilters, setHasModifiedFilters] = useState<boolean>(false);

  /* Threshold selections are only stored in this component's state until they
  are applied, at which point they are passed to the parent component via callback.

  Note that this list of thresholds can be quite long, and the user may have multiple
  thresholds for the same `metric`, which is why we can't structure this as a nicely named object / have to rely on indexing a list of thresholds */
  const [thresholds, setThresholds] =
    useState<ThresholdFilterData[]>(selectedThresholds);

  const filterOperators: ThresholdFilterOperator[] = [">=", "<="];

  const handleCancel = () => {
    setAnchorEl(null);
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

  // selectedThresholds are the thresholds in the parent state,
  // while thresholds are internal to this component's state.
  // handleThresholdFilterTagRemove uses selectedThresholds rather than thresholds
  // because this function is used while the threshold filter modal is closed.
  const handleThresholdFilterTagRemove = (thresholdIdx: number) => {
    const newThresholds = [
      ...selectedThresholds.slice(0, thresholdIdx),
      ...selectedThresholds.slice(thresholdIdx + 1, selectedThresholds.length),
    ];
    onApply(newThresholds);
  };

  const handleAddThresholdItem = () => {
    const firstMetric = metricOptions[0];

    setThresholds((existingThresholds: ThresholdFilterData[]) => [
      ...(Array.isArray(existingThresholds) ? existingThresholds : []),
      {
        metric: firstMetric.value,
        metricDisplay: firstMetric.text || "",
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
    setThresholds(selectedThresholds);
    if (isEmpty(thresholds) || !thresholds) {
      handleAddThresholdItem();
    }
  };

  return (
    <>
      <div>
        <InputDropdown
          disabled={disabled}
          onClick={handleDropdownInputClick}
          label={<div className={cs.label}>Thresholds</div>}
          sdsStyle="minimal"
          sdsStage="default"
        />
        <DropdownPopper
          anchorEl={anchorEl}
          open={Boolean(anchorEl) && !disabled}
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
                  data-testid="apply"
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
      </div>
      {shouldShowTags && (
        <div className={cs.filterTagsList}>
          {selectedThresholds.map((threshold, index) => {
            return (
              <div
                className={cs.filterTagContainer}
                key={`threshold-tag-container-${index}`}
              >
                <ThresholdFilterTag
                  threshold={threshold}
                  onClose={() => {
                    handleThresholdFilterTagRemove(index);
                  }}
                  disabled={disabled}
                  className={cs.filterTag}
                  key={`threshold-filter-tag-${index}`}
                />
              </div>
            );
          })}
        </div>
      )}
    </>
  );
};
