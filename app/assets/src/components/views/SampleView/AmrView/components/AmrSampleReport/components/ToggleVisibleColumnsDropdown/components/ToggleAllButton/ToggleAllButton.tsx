import { Button } from "czifui";
import React from "react";
import {
  ColumnSection,
  COLUMN_ID_TO_NAME,
  SECTION_TO_COLUMN_IDS,
} from "../../../../../../constants";
import { FormattedDropdownOption } from "../../ToggleVisibleColumnsDropdown";

interface ToggleAllButtonProps {
  dropdownOptions: FormattedDropdownOption[];
  pendingOptions: FormattedDropdownOption[];
  section: ColumnSection;
  setPendingOptions: (options: FormattedDropdownOption[]) => void;
}

export const ToggleAllButton = ({
  dropdownOptions,
  pendingOptions,
  section,
  setPendingOptions,
}: ToggleAllButtonProps) => {
  const sectionColumnIds = SECTION_TO_COLUMN_IDS.get(section);
  const isAllVisible = sectionColumnIds.every(columnId => {
    const columnName = COLUMN_ID_TO_NAME.get(columnId);
    return !!pendingOptions.find(option => option.name === columnName);
  });

  // Show or Hide all columns in a section
  const toggleAllColumnsInSection = (section: ColumnSection, show: boolean) => {
    const otherSectionOptions = pendingOptions.filter(options => {
      const optionColumnId = COLUMN_ID_TO_NAME.revGet(options.name);
      const optionSection = SECTION_TO_COLUMN_IDS.revGet(optionColumnId);
      return optionSection !== section;
    });

    if (!show) {
      setPendingOptions(otherSectionOptions);
      return;
    }

    const columnIds = SECTION_TO_COLUMN_IDS.get(section);
    const sectionOptions = columnIds.map(columnId => {
      const columnName = COLUMN_ID_TO_NAME.get(columnId);
      return {
        ...dropdownOptions.find(option => option.name === columnName),
      };
    });

    setPendingOptions([...otherSectionOptions, ...sectionOptions]);
  };

  return isAllVisible ? (
    <Button
      sdsType="primary"
      sdsStyle="minimal"
      onClick={() => toggleAllColumnsInSection(section, false)}
    >
      Deselect All
    </Button>
  ) : (
    <Button
      sdsType="primary"
      sdsStyle="minimal"
      onClick={() => toggleAllColumnsInSection(section, true)}
    >
      Select All
    </Button>
  );
};
