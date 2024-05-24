import { InputCheckbox, InputText, Tooltip } from "@czi-sds/components";
import React, { useState } from "react";
import { CHECKBOX_SELECTION_DISABLED_TOOLTIP_TEXT } from "../../constants";
import cs from "./checkbox_with_input.scss";

type CheckboxWithInputProps = {
  selectedCheckboxes: string[];
  setSelectedCheckboxes: (values: string[]) => void;
  isSelectionDisabled?: boolean;
  isCheckboxChecked: boolean;
  prefix: string;
};

export function CheckboxWithInput({
  selectedCheckboxes,
  setSelectedCheckboxes,
  isSelectionDisabled = false,
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
      if (!isSelectionDisabled) {
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
    if (isSelectionDisabled && !isCheckboxChecked) {
      // don't allow user to input text if max selections reached
      setInputValue("");
    } else {
      newSelectedCheckboxes.push(`${prefix}: ${event.target.value}`);
      setInputValue(event.target.value);
      setSelectedCheckboxes(newSelectedCheckboxes);
    }
  }

  const checkbox = () => {
    const inputCheckbox = (
      <InputCheckbox
        stage={isCheckboxChecked ? "checked" : "unchecked"}
        label="Checkbox with input"
        id="checkbox-w-input"
        onClick={handleOtherCheckboxChange}
      />
    );

    if (isSelectionDisabled && !isCheckboxChecked) {
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
    <div className={cs.otherCheckboxSection}>
      {checkbox()}
      <div className={cs.otherLabel}>{prefix}</div>
      <InputText
        className={cs.otherInput}
        sdsType="textField"
        value={inputValue}
        onChange={handleCheckboxChangeWithInput}
        label={"label"}
        hideLabel={true}
        id={prefix}
      />
    </div>
  );
}
