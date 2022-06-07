import { Button, DropdownPopper } from "czifui";
import { isEmpty } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { ThresholdFilterList } from "~/components/ui/controls/dropdowns";
import { NON_BACKGROUND_DEPENDENT_THRESHOLDS } from "~/components/views/SampleView/constants";
import {
  ThresholdFilterData,
  ThresholdFilterOperator,
} from "~/interface/dropdown";
import FilterTrigger from "./FilterTrigger";
import TaxonFilterSDS, { TaxonOption } from "./TaxonFilterSDS";

import cs from "./taxon_threshold_filter.scss";

interface TaxonThresholdFilterProps {
  domain: string;
  selectedOptions: TaxonOption[];
  selectedThresholds: ThresholdFilterData[];
  onFilterApply: (
    taxa: TaxonOption[],
    thresholds: ThresholdFilterData[],
  ) => void;
  disabled: boolean;
}

const TaxonThresholdFilter = ({
  domain,
  selectedOptions,
  selectedThresholds,
  onFilterApply,
  disabled = false,
}: TaxonThresholdFilterProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  // Taxa and threshold selections are only stored in this component's state until they
  // are applied, at which point they are passed to the parent component via callback
  const [selectedTaxa, setSelectedTaxa] = React.useState<TaxonOption[]>(
    selectedOptions,
  );
  const [thresholds, setThresholds] = useState<ThresholdFilterData[]>(
    selectedThresholds,
  );

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
    setThresholds((existingThresholds: ThresholdFilterData[]) => [
      ...existingThresholds.slice(0, thresholdIdx),
      threshold,
      ...existingThresholds.slice(thresholdIdx + 1, existingThresholds.length),
    ]);
  };

  const handleThresholdRemove = (thresholdIdx: number) => {
    setThresholds((existingThresholds: ThresholdFilterData[]) => [
      ...existingThresholds.slice(0, thresholdIdx),
      ...existingThresholds.slice(thresholdIdx + 1, existingThresholds.length),
    ]);
  };

  const handleAddThresholdItem = () => {
    const firstMetric = NON_BACKGROUND_DEPENDENT_THRESHOLDS[0];

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
            handleChange={(selectedTaxaOptions: TaxonOption[]) =>
              setSelectedTaxa(selectedTaxaOptions)
            }
          />
          <div className={cs.thresholdDescriptor}>
            Meets all of these thresholds:
          </div>
          <ThresholdFilterList
            metrics={NON_BACKGROUND_DEPENDENT_THRESHOLDS}
            operators={filterOperators}
            thresholds={thresholds}
            onChangeThreshold={(idx, threshold) =>
              handleThresholdChange(idx, threshold)
            }
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
                disabled={isEmpty(selectedTaxa)}
                onClick={() => {
                  setAnchorEl(null);
                  onFilterApply(selectedTaxa, thresholds);
                }}
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

export default TaxonThresholdFilter;
