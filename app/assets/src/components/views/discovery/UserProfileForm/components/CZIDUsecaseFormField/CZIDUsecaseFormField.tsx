import React, { useEffect, useState } from "react";
import Checkbox from "../Checkbox";
import CheckboxWithInput from "../CheckboxWithInput";
import {
  CHECKBOX_WITH_INPUT_PREFIX,
  CZID_USECASE_OPTIONS,
  MAX_SELECTIONS,
} from "./constants";
import cs from "./czid_usecase_form_field.scss";

interface CZIDUsecaseFormFieldProps {
  selectedUsecaseCheckboxes: string[];
  setSelectedUsecaseCheckboxes: (checkBoxValues: string[]) => void;
}

export function CZIDUsecaseFormField({
  selectedUsecaseCheckboxes,
  setSelectedUsecaseCheckboxes,
}: CZIDUsecaseFormFieldProps) {
  const [isOtherCheckboxChecked, setIsOtherCheckboxChecked] =
    useState<boolean>(false);

  useEffect(() => {
    const isChecked = selectedUsecaseCheckboxes.some(entry =>
      entry.includes(CHECKBOX_WITH_INPUT_PREFIX),
    );
    setIsOtherCheckboxChecked(isChecked);
  }, [selectedUsecaseCheckboxes]);

  const handleCheckboxChange = (checkboxValue: string) => {
    const isChecked = selectedUsecaseCheckboxes.includes(checkboxValue);
    let newSelectedCheckboxes = [...selectedUsecaseCheckboxes];
    if (isChecked) {
      // User un-checked the checkbox
      newSelectedCheckboxes = newSelectedCheckboxes.filter(
        v => v !== checkboxValue,
      );
    } else {
      if (newSelectedCheckboxes.length < MAX_SELECTIONS) {
        newSelectedCheckboxes.push(checkboxValue);
      }
    }
    setSelectedUsecaseCheckboxes(newSelectedCheckboxes);
  };

  return (
    <div className={cs.main}>
      <div className={cs.titleSection}>
        <span className={cs.titleMainText}>How do you plan to use CZ ID?</span>
        <span className={cs.titleSubText}>
          {" "}
          (select up to {MAX_SELECTIONS})
        </span>
      </div>

      <div className={cs.checkBoxSection}>
        {CZID_USECASE_OPTIONS.map(option => (
          <Checkbox
            key={option}
            checkBoxValue={option}
            selectedCheckboxes={selectedUsecaseCheckboxes}
            handleCheckboxChange={handleCheckboxChange}
          />
        ))}
        <CheckboxWithInput
          selectedCheckboxes={selectedUsecaseCheckboxes}
          setSelectedCheckboxes={setSelectedUsecaseCheckboxes}
          isCheckboxChecked={isOtherCheckboxChecked}
          prefix={CHECKBOX_WITH_INPUT_PREFIX}
        />
      </div>
    </div>
  );
}
