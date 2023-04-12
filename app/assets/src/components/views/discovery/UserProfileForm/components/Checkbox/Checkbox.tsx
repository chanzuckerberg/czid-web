import { InputCheckbox } from "czifui";
import React from "react";
import cs from "./checkbox.scss";

interface CheckboxProps {
  checkBoxValue: string;
  selectedCheckboxes: string[];
  handleCheckboxChange: (checkBoxValue: string) => void;
}

export function Checkbox({
  checkBoxValue,
  selectedCheckboxes,
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

  return (
    <div
      className={cs.checkbox}
      role="checkbox"
      tabIndex={0}
      aria-checked={selectedCheckboxes.includes(checkBoxValue)}
      onClick={() => handleCheckboxChange(checkBoxValue)}
      onKeyDown={handleKeyDown}
    >
      <InputCheckbox stage={isChecked} />
      {checkBoxValue}
    </div>
  );
}
