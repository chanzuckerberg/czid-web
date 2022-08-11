import { map } from "lodash/fp";
import React from "react";
import { MultipleNestedDropdown } from "~/components/ui/controls/dropdowns";
import { DropdownOption } from "~/interface/shared";

const ANNOTATION_OPTIONS = ["Hit", "Not a hit", "Inconclusive"];

interface AnnotationFilterProps {
  selectedAnnotations: DropdownOption[];
  onChange: (DropdownOption) => void;
}

const AnnotationFilter = ({
  selectedAnnotations,
  onChange,
}: AnnotationFilterProps) => {
  return (
    <MultipleNestedDropdown
      options={map(
        (option: string) => ({ text: option, value: option }),
        ANNOTATION_OPTIONS,
      )}
      selectedOptions={selectedAnnotations}
      onChange={onChange}
      boxed
      rounded
      label="Annotation"
    />
  );
};

export default AnnotationFilter;
