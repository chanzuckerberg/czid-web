import cx from "classnames";
import React from "react";

import Label from "~/components/ui/labels/Label";
import Icon from "~ui/icons/Icon";

import cs from "./filter_tag.scss";

interface FilterTagProps {
  text?: string;
  onClose?: $TSFixMeFunction;
  className?: string;
}

const FilterTag = ({ text, onClose, className }: FilterTagProps) => {
  const labelText = (
    <>
      {text}
      {onClose && <Icon name="close" onClick={onClose} />}
    </>
  );

  return (
    <Label
      className={cx(cs.filterTag, className)}
      size="tiny"
      text={labelText}
    />
  );
};

export default FilterTag;
