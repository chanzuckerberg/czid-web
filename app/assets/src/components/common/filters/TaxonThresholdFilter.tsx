import { Button, DropdownPopper } from "czifui";
import { isEmpty } from "lodash/fp";
import React, { useEffect, useState } from "react";
import FilterTrigger from "./FilterTrigger";
import TaxonFilterSDS, { TaxonOption } from "./TaxonFilterSDS";

import cs from "./taxon_threshold_filter.scss";

interface TaxonThresholdFilterProps {
  domain: string;
  selectedOptions: TaxonOption[];
  onChange: (selected: TaxonOption[]) => void;
  disabled: boolean;
}

const TaxonThresholdFilter = ({
  domain,
  selectedOptions,
  onChange,
  disabled = false,
}: TaxonThresholdFilterProps) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  // Taxa selections are "pending" as soon as they're made. Once the Apply button is clicked, then the taxa filters gets applied.
  const [selectedTaxa, setSelectedTaxa] = React.useState<TaxonOption[]>(
    selectedOptions,
  );

  useEffect(() => {
    setSelectedTaxa(selectedOptions);
  }, [selectedOptions]);

  const handleCancel = () => {
    setAnchorEl(null);
    setSelectedTaxa(selectedOptions);
  };

  const handleTaxonLabelClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const renderActions = () => (
    <div className={cs.actions}>
      <div className={cs.action}>
        <Button
          sdsStyle="square"
          sdsType="primary"
          disabled={isEmpty(selectedTaxa)}
          onClick={() => onChange(selectedTaxa)}
        >
          Apply
        </Button>
      </div>
      <div className={cs.action}>
        <Button sdsStyle="square" sdsType="secondary" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );

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
          {/** TODO: Render Threshold Filter */}
          {renderActions()}
        </div>
      </DropdownPopper>
    </>
  );
};

export default TaxonThresholdFilter;
