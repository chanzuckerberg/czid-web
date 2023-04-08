import React from "react";
import CZIDUsecaseCheckbox from "./components/CZIDUsecaseCheckbox";
import {
  AMR_DETECTION_OPTION,
  CLINICAL_RESEARCH_OPTION,
  DISCOVER_NOVEL_VIRUSES_OPTION,
  IDENTIFY_KNOWN_PATHOGEN_OPTION,
  MAX_SELECTIONS,
  MICROBIOME_ANALYSIS_OPTION,
  PHYLOGENETIC_TREE_OPTION,
  SC2_CONSENSUS_GENOME_OPTION,
  SURVEILLANCE_OF_VECTORS_OPTION,
  TRAINING_TOOL_OPTION,
  VIRAL_CONSENSUS_GENOME_NON_SC2_OPTION,
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
  const handleCheckboxChange = (checkboxValue: string) => {
    const isChecked = selectedUsecaseCheckboxes.includes(checkboxValue);
    let newSelectedCheckboxes = [...selectedUsecaseCheckboxes];
    if (isChecked) {
      // user wants to remove checkbox from the list
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

  const allUseCaseOptions = [
    IDENTIFY_KNOWN_PATHOGEN_OPTION,
    CLINICAL_RESEARCH_OPTION,
    DISCOVER_NOVEL_VIRUSES_OPTION,
    MICROBIOME_ANALYSIS_OPTION,
    SURVEILLANCE_OF_VECTORS_OPTION,
    AMR_DETECTION_OPTION,
    VIRAL_CONSENSUS_GENOME_NON_SC2_OPTION,
    SC2_CONSENSUS_GENOME_OPTION,
    PHYLOGENETIC_TREE_OPTION,
    TRAINING_TOOL_OPTION,
  ];

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
        {allUseCaseOptions.map(option => (
          <CZIDUsecaseCheckbox
            key={option}
            checkBoxValue={option}
            selectedCheckboxes={selectedUsecaseCheckboxes}
            handleCheckboxChange={handleCheckboxChange}
          />
        ))}
      </div>
    </div>
  );
}
