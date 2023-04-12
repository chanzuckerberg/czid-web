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
        <span className={cs.titleMainText}>
          Which statement best describes your expertise level in analyzing
          sequencing data?
        </span>
        <span className={cs.titleSubText}> (select 1)</span>
      </div>
      <RadioGroup
        aria-labelledby="userform-radio-buttons-group-label"
        name="userform-radio-buttons-group"
        className={cs.radioSection}
      >
        {allExpertiseOptions.map((expertiseOption, index) => (
          <label key={index} className={cs.label}>
            <InputRadio
              label={expertiseOption}
              value="expertiseOption"
              onClick={() => handleRadioSelectChange(expertiseOption)}
              stage={isChecked(expertiseOption) ? "checked" : "unchecked"}
            />
            <span>{expertiseOption}</span>
          </label>
        ))}
      </RadioGroup>
    </div>
  );
}
