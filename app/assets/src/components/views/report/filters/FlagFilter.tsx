import { map } from "lodash/fp";
import React, { useContext } from "react";
import { UserContext } from "~/components/common/UserContext";
import { MultipleNestedDropdown } from "~/components/ui/controls/dropdowns";
import { CATEGORIES } from "~/components/ui/labels/PathogenLabel";
import { MULTITAG_PATHOGENS_FEATURE } from "~/components/utils/features";
import { DropdownOption } from "~/interface/shared";

const FLAG_OPTIONS = Object.keys(CATEGORIES).map(key => ({
  name: CATEGORIES[key].text,
  code: CATEGORIES[key].code,
}));

interface FlagFilterProps {
  selectedFlags: DropdownOption[] | string[];
  onChange: (DropdownOption) => void;
}

const FlagFilter = ({ selectedFlags, onChange }: FlagFilterProps) => {
  const userContext = useContext(UserContext);
  const { allowedFeatures } = userContext || {};
  // if a user doesn't have the multi-tagging feature enabled we need to limit the filtering
  // options to "knownPathogen"
  const flagOptions = allowedFeatures.includes(MULTITAG_PATHOGENS_FEATURE)
    ? FLAG_OPTIONS
    : [
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
        flagOptions,
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
