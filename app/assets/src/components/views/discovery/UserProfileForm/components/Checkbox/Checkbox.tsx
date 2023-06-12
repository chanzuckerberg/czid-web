import { InputCheckbox, Tooltip } from "@czi-sds/components";
import React from "react";
import { CHECKBOX_SELECTION_DISABLED_TOOLTIP_TEXT } from "../../constants";
import cs from "./checkbox.scss";

interface CheckboxProps {
  checkBoxValue: string;
  selectedCheckboxes: string[];
  isSelectionDisabled?: boolean;
  handleCheckboxChange: (checkBoxValue: string) => void;
}

export function Checkbox({
  checkBoxValue,
  selectedCheckboxes,
  isSelectionDisabled = false,
  handleCheckboxChange,
}: CheckboxProps) {
  // add keyboard support for checkboxes
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      handleCheckboxChange(checkBoxValue);
    }
  };

  const isChecked = selectedCheckboxes.includes(checkBoxValue)
    ? "checked"
    : "unchecked";

  const checkBox = () => {
    const inputCheckbox = <InputCheckbox stage={isChecked} />;

    if (isSelectionDisabled && isChecked === "unchecked") {
      return (
        <Tooltip
          arrow
          placement="top"
          title={CHECKBOX_SELECTION_DISABLED_TOOLTIP_TEXT}
        >
          <span>{inputCheckbox}</span>
        </Tooltip>
      );
    }

    return inputCheckbox;
  };

  return (
    <div
      className={cs.checkbox}
      role="checkbox"
      tabIndex={0}
      aria-checked={selectedCheckboxes.includes(checkBoxValue)}
      onClick={() => handleCheckboxChange(checkBoxValue)}
      onKeyDown={handleKeyDown}
    >
      {checkBox()}
      {checkBoxValue}
    </div>
  );
}
