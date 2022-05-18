import cx from "classnames";
import React from "react";
import IconArrowDownSmall from "~/components/ui/icons/IconArrowDownSmall";

import cs from "./filter_trigger.scss";

interface FilterTriggerProps {
  extraStyling?: string;
  disabled: boolean;
  label: string;
  onClick: (args: any) => any;
}

const FilterTrigger = ({
  disabled,
  extraStyling = "",
  label,
  onClick,
}: FilterTriggerProps) => (
  <div
    className={cx(cs.taxonFilterLabel, disabled && cs.disabled, extraStyling)}
    onClick={onClick}
  >
    {label}
    <IconArrowDownSmall className={cs.dropdownArrow} />
  </div>
);

export default FilterTrigger;
