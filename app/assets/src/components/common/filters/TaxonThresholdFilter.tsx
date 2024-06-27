import { Button, DropdownPopper } from "@czi-sds/components";
import { find, isEmpty, isEqual, map, some } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { ThresholdFilterList } from "~/components/ui/controls/dropdowns";
import { NON_BACKGROUND_DEPENDENT_SHORT_READS_THRESHOLDS } from "~/components/views/SampleView/utils";
import {
  ThresholdFilterData,
  ThresholdFilterOperator,
} from "~/interface/dropdown";
import FilterTrigger from "./FilterTrigger";
import TaxonFilterSDS from "./TaxonFilterSDS";
import cs from "./taxon_threshold_filter.scss";
import { TaxonOption } from "./types";

interface TaxonThresholdFilterProps {
  domain: string;
  selectedOptions: TaxonOption[];
  selectedThresholds: ThresholdFilterData[];
  onFilterApply: (
    taxa: TaxonOption[],
    thresholds: ThresholdFilterData[],
  ) => void;
  disabled: boolean;
  thresholdFilterEnabled: boolean;
}

const TaxonThresholdFilter = ({
  domain,
  selectedOptions,
  selectedThresholds,
  onFilterApply,
  disabled = false,
  thresholdFilterEnabled = true,
}: TaxonThresholdFilterProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [hasModifiedFilters, setHasModifiedFilters] = useState<boolean>(false);
  // Taxa and threshold selections are only stored in this component's state until they
  // are applied, at which point they are passed to the parent component via callback
  const [selectedTaxa, setSelectedTaxa] =
    React.useState<TaxonOption[]>(selectedOptions);
  const [thresholds, setThresholds] =
    useState<ThresholdFilterData[]>(selectedThresholds);

  const filterOperators: ThresholdFilterOperator[] = [">=", "<="];

  useEffect(() => {
    setSelectedTaxa(selectedOptions);
  }, [selectedOptions]);

  useEffect(() => {
    setThresholds(selectedThresholds);
  }, [selectedThresholds]);

  const handleCancel = () => {
    setAnchorEl(null);
    setSelectedTaxa(selectedOptions);
    setThresholds(selectedThresholds);
  };

  const handleTaxonLabelClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
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
    const firstMetric = NON_BACKGROUND_DEPENDENT_SHORT_READS_THRESHOLDS[0];

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
    onFilterApply(selectedTaxa, thresholds);
  };

  // If any of the newThresholds were not found in the existing selected thresholds, then the threshold filters were modified
  const checkIfThresholdFiltersWereModified = (
    newThresholds: ThresholdFilterData[],
  ) => {
    return some(
      (newThreshold: ThresholdFilterData) =>
        !isEmpty(newThreshold.value) &&
        find(newThreshold, selectedThresholds) === undefined,
      newThresholds,
    );
  };

  return (
    <>
      <FilterTrigger
        disabled={disabled}
        onClick={handleTaxonLabelClick}
        label="Taxon"
      />
      <DropdownPopper
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        placement="bottom-start"
      >
        <div className={cs.filterContainer}>
          <div className={cs.title}>Taxon Filter</div>
          <div className={cs.filterDescriptor}>
            Has at least one of these taxa:
          </div>
          <TaxonFilterSDS
            domain={domain}
            selectedTaxa={selectedTaxa}
            handleChange={(selectedTaxaOptions: TaxonOption[]) => {
              const selectedTaxaHasChanged = !isEqual(
                map("id", selectedOptions).sort(),
                map("id", selectedTaxaOptions).sort(),
              );
              setHasModifiedFilters(selectedTaxaHasChanged);
              setSelectedTaxa(selectedTaxaOptions);
            }}
          />
          {thresholdFilterEnabled && thresholds?.length > 0 && (
            <div className={cs.thresholdDescriptor}>
              Meets all of these thresholds:
            </div>
          )}
          {thresholdFilterEnabled && (
            <ThresholdFilterList
              // Taxon threshold filter is currently not available for long-read-mngs samples.
              // For this reason, this filter only supports thresholds that correspond to reads (vs bases) data.
              metrics={NON_BACKGROUND_DEPENDENT_SHORT_READS_THRESHOLDS}
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
          )}
          <div className={cs.actions}>
            <div data-testid="apply" className={cs.action}>
              <Button
                sdsStyle="square"
                sdsType="primary"
                disabled={!hasModifiedFilters || isEmpty(selectedTaxa)}
                onClick={handleApply}
              >
                Apply
              </Button>
            </div>
            <div data-testid="cancel" className={cs.action}>
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

export default TaxonThresholdFilter;
