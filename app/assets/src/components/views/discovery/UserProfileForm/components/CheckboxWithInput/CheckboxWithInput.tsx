import { InputCheckbox, InputText } from "czifui";
import React, { useState } from "react";
import cs from "./checkbox_with_input.scss";

type CheckboxWithInputProps = {
  selectedCheckboxes: string[];
  setSelectedCheckboxes: (values: string[]) => void;
  isCheckboxChecked: boolean;
  prefix: string;
};

export function CheckboxWithInput({
  selectedCheckboxes,
  setSelectedCheckboxes,
  isCheckboxChecked,
  prefix,
}: CheckboxWithInputProps) {
  const [inputValue, setInputValue] = useState<string>("");

  function handleOtherCheckboxChange() {
    const isChecked = selectedCheckboxes.some(entry => entry.includes(prefix));
    if (isChecked) {
      const newSelectedReferralCheckboxes = selectedCheckboxes.filter(
        item => !item.includes(prefix),
      );
      setSelectedCheckboxes(newSelectedReferralCheckboxes);
      setInputValue("");
    } else {
      setSelectedCheckboxes([...selectedCheckboxes, prefix]);
    }
  }

  function handleCheckboxChangeWithInput(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const newSelectedReferralCheckboxes = selectedCheckboxes.filter(
      item => !item.includes(prefix),
    );
    newSelectedReferralCheckboxes.push(`${prefix}: ${event.target.value}`);
    setSelectedCheckboxes(newSelectedReferralCheckboxes);
    setInputValue(event.target.value);
  }
  // add keyboard support for checkboxes
  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter") {
      handleOtherCheckboxChange();
    }
  };

  return (
    <div
      className={cs.otherCheckboxSection}
      role="checkbox"
      tabIndex={0}
      aria-checked={selectedCheckboxes.includes(inputValue)}
      onClick={handleOtherCheckboxChange}
      onKeyDown={handleKeyDown}
    >
      <InputCheckbox
        stage={isCheckboxChecked ? "checked" : "unchecked"}
        label="Checkbox with input"
        id="checkbox-w-input"
      />
      <div className={cs.otherLabel}>{prefix}</div>
      <InputText
        className={cs.otherInput}
        sdsType="textField"
        value={inputValue}
        onChange={handleCheckboxChangeWithInput}
        label={"label"}
        hideLabel={true}
        id={prefix}
        variant="standard"
      />
    </div>
  );
}
