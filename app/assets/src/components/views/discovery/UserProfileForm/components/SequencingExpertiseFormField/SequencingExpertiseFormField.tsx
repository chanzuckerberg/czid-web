import { RadioGroup } from "@mui/material";
import { InputRadio } from "czifui";
import React from "react";
import { EXPERT, HIGH, LOW, MEDIUM, NONE_OF_THE_ABOVE } from "./constants";
import cs from "./sequencing_expertise_form_field.scss";

interface SequencingExpertiseFormFieldProps {
  selectedSequencingExpertise: string;
  setSelectedSequencingExpertise: (selectedSequencingExpertise: string) => void;
}

export function SequencingExpertiseFormField({
  selectedSequencingExpertise,
  setSelectedSequencingExpertise,
}: SequencingExpertiseFormFieldProps) {
  function handleRadioSelectChange(expertiseOption: string) {
    setSelectedSequencingExpertise(expertiseOption);
  }

  function isChecked(expertiseOption: string) {
    return selectedSequencingExpertise === expertiseOption;
  }

  const allExpertiseOptions = [LOW, MEDIUM, HIGH, EXPERT, NONE_OF_THE_ABOVE];
  return (
    <div className={cs.main}>
      <div className={cs.titleSection}>
        Which statement best describes your expertise level in analyzing
        sequencing data?
      </div>
      <RadioGroup
        aria-labelledby="userform-radio-buttons-group-label"
        name="userform-radio-buttons-group"
      >
        {allExpertiseOptions.map((expertiseOption, index) => {
          const expertiseOptionLabel =
            expertiseOption.text || expertiseOption.subtext;
          return (
            <label key={index} className={cs.label}>
              <InputRadio
                label={expertiseOptionLabel}
                value="expertiseOption"
                onClick={() => handleRadioSelectChange(expertiseOptionLabel)}
                stage={
                  isChecked(expertiseOptionLabel) ? "checked" : "unchecked"
                }
              />
              <span>
                {expertiseOption.text && (
                  <span className={cs.boldText}>{expertiseOption.text}</span>
                )}
                {expertiseOption.text && " - "}
                {expertiseOption.subtext}
              </span>
            </label>
          );
        })}
      </RadioGroup>
    </div>
  );
}
