import { ButtonIcon } from "@czi-sds/components";
import cx from "classnames";
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
    <ButtonIcon
      className={cs.dropdownArrow}
      sdsSize="small"
      sdsType="secondary"
      sdsIcon="chevronDown"
    />
  </div>
);

export default FilterTrigger;
