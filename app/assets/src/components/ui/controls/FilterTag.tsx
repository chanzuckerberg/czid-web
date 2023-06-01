import cx from "classnames";
import React from "react";
import Label from "~/components/ui/labels/Label";
import IconCloseSmall from "../icons/IconCloseSmall";
import cs from "./filter_tag.scss";

interface FilterTagProps {
  text?: string;
  onClose?: $TSFixMeFunction;
  disabled?: boolean;
  className?: string;
}

const FilterTag = ({ text, onClose, disabled, className }: FilterTagProps) => {
  const labelText = (
    <div className={cs.labelText} data-testid="filter-tag">
      {text}
      {onClose && (
        <IconCloseSmall
          className={cs.closeIcon}
          onClick={() => {
            if (!disabled) onClose();
          }}
        />
      )}
    </div>
  );

  return (
    <Label
      className={cx(cs.filterTag, className, disabled ? "disabled" : "")}
      size="tiny"
      text={labelText}
    />
  );
};

export default FilterTag;
