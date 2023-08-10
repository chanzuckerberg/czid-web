import React, { useEffect, useState } from "react";
import Checkbox from "../Checkbox";
import CheckboxWithInput from "../CheckboxWithInput";
import { CHECKBOX_WITH_INPUT_PREFIX, REFERRAL_OPTIONS } from "./constants";
import cs from "./czid_referral_form_field.scss";

interface CZIDReferralFormFieldProps {
  selectedReferralCheckboxes: string[];
  setSelectedReferralCheckboxes: (checkBoxValues: string[]) => void;
}

export function CZIDReferralFormField({
  selectedReferralCheckboxes,
  setSelectedReferralCheckboxes,
}: CZIDReferralFormFieldProps) {
  const [isOtherCheckboxChecked, setIsOtherCheckboxChecked] =
    useState<boolean>(false);

  useEffect(() => {
    const isChecked = selectedReferralCheckboxes.some(entry =>
      entry.includes(CHECKBOX_WITH_INPUT_PREFIX),
    );
    setIsOtherCheckboxChecked(isChecked);
  }, [selectedReferralCheckboxes]);

  const handleCheckboxChange = (checkboxValue: string) => {
    const isChecked = selectedReferralCheckboxes.includes(checkboxValue);
    let newSelectedCheckboxes = [...selectedReferralCheckboxes];
    if (isChecked) {
      // User un-checked the checkbox
      newSelectedCheckboxes = newSelectedCheckboxes.filter(
        v => v !== checkboxValue,
      );
    } else {
      newSelectedCheckboxes.push(checkboxValue);
    }
    setSelectedReferralCheckboxes(newSelectedCheckboxes);
  };

  return (
    <div>
      <div className={cs.titleSection}>
        <span className={cs.titleMainText}>How did you learn about CZ ID?</span>
        <span className={cs.titleSubText}> (select all that apply)</span>
        <span className={cs.titleOptionalText}> — optional</span>
      </div>
      <div>
        {REFERRAL_OPTIONS.map(option => (
          <Checkbox
            key={option}
            checkBoxValue={option}
            selectedCheckboxes={selectedReferralCheckboxes}
            handleCheckboxChange={handleCheckboxChange}
          />
        ))}
        <CheckboxWithInput
          selectedCheckboxes={selectedReferralCheckboxes}
          setSelectedCheckboxes={setSelectedReferralCheckboxes}
          isCheckboxChecked={isOtherCheckboxChecked}
          prefix={CHECKBOX_WITH_INPUT_PREFIX}
        />
      </div>
    </div>
  );
}
