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

      <div className={cs.optionsContainer}>
        {CZID_USECASE_OPTIONS.map(option => (
          <div className={cs.option} key={option}>
            <Checkbox
              checkBoxValue={option}
              isSelectionDisabled={
                selectedUsecaseCheckboxes.length >= MAX_SELECTIONS
              }
              selectedCheckboxes={selectedUsecaseCheckboxes}
              handleCheckboxChange={handleCheckboxChange}
            />
          </div>
        ))}
        <div className={cs.option}>
          <CheckboxWithInput
            selectedCheckboxes={selectedUsecaseCheckboxes}
            setSelectedCheckboxes={setSelectedUsecaseCheckboxes}
            isSelectionDisabled={
              selectedUsecaseCheckboxes.length >= MAX_SELECTIONS
            }
            isCheckboxChecked={isOtherCheckboxChecked}
            prefix={CHECKBOX_WITH_INPUT_PREFIX}
          />
        </div>
      </div>
    </div>
  );
}
