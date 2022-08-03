import cx from "classnames";
import { Icon, IconButton } from "czifui";
import React from "react";

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
    <IconButton className={cs.dropdownArrow} sdsSize="small">
      <Icon sdsIcon="chevronDown" sdsSize="xs" sdsType="iconButton" />
    </IconButton>
  </div>
);

export default FilterTrigger;
