import { InputCheckbox, InputText } from "czifui";
import React, { useState } from "react";
import cs from "./checkbox_with_input.scss";

type CheckboxWithInputProps = {
  selectedCheckboxes: string[];
  setSelectedCheckboxes: (values: string[]) => void;
  isCheckboxChecked: boolean;
  prefix: string;
  maxSelections?: number;
};

export function CheckboxWithInput({
  selectedCheckboxes,
  setSelectedCheckboxes,
  isCheckboxChecked,
  prefix,
  maxSelections,
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
      if (maxSelections) {
        if (selectedCheckboxes.length < maxSelections) {
          setSelectedCheckboxes([...selectedCheckboxes, `${prefix}: `]);
        }
      } else {
        setSelectedCheckboxes([...selectedCheckboxes, `${prefix}: `]);
      }
    }
  }

  function handleCheckboxChangeWithInput(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const newSelectedCheckboxes = selectedCheckboxes.filter(
      item => !item.includes(prefix),
    );
    if (maxSelections) {
      if (newSelectedCheckboxes.length < maxSelections) {
        newSelectedCheckboxes.push(`${prefix}: ${event.target.value}`);
        setInputValue(event.target.value);
        setSelectedCheckboxes(newSelectedCheckboxes);
      } else {
        // don't allow user to input text if max selections reached
        setInputValue("");
      }
    } else {
      newSelectedCheckboxes.push(`${prefix}: ${event.target.value}`);
      setInputValue(event.target.value);
      setSelectedCheckboxes(newSelectedCheckboxes);
    }
  }

  return (
    <div className={cs.otherCheckboxSection}>
      <InputCheckbox
        stage={isCheckboxChecked ? "checked" : "unchecked"}
        label="Checkbox with input"
        id="checkbox-w-input"
        onClick={handleOtherCheckboxChange}
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
