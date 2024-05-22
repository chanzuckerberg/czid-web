import { map } from "lodash/fp";
import React from "react";
import { MultipleNestedDropdown } from "~/components/ui/controls/dropdowns";
import { CATEGORIES } from "~/components/ui/labels/PathogenLabel";
import { DropdownOption } from "~/interface/shared";

interface FlagFilterProps {
  selectedFlags: DropdownOption[] | string[];
  onChange: (DropdownOption) => void;
}

const FlagFilter = ({ selectedFlags, onChange }: FlagFilterProps) => {
  // We are removing the multi-tagging feature, so we need to limit the filtering
  // options to "knownPathogen". This should probably not be a dropdown in the future.
  const flagOption = [
    {
      name: CATEGORIES.knownPathogen.text,
      code: CATEGORIES.knownPathogen.code,
    },
  ];

  return (
    <MultipleNestedDropdown
      options={map(
        (option: { name: string; code: string }) => ({
          text: option.name,
          value: option.code,
        }),
        flagOption,
      )}
      selectedOptions={selectedFlags}
      onChange={onChange}
      boxed
      rounded
      label="Pathogen Flags"
    />
  );
};

export default FlagFilter;
