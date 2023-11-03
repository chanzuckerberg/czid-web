import { Button } from "@czi-sds/components";
import React from "react";
import {
  ColumnId,
  ColumnSection,
  COLUMNS_ALWAYS_PRESENT,
  COLUMN_ID_TO_NAME,
  SECTION_TO_COLUMN_IDS,
} from "~/components/views/SampleView/components/AmrView/constants";
import { SDSFormattedDropdownOption } from "~/interface/dropdown";

interface ToggleAllButtonProps {
  dropdownOptions: SDSFormattedDropdownOption[];
  dropdownValue: SDSFormattedDropdownOption[];
  section: ColumnSection;
  setPendingOptions: (options: SDSFormattedDropdownOption[]) => void;
}

export const ToggleAllButton = ({
  dropdownOptions,
  dropdownValue,
  section,
  setPendingOptions,
}: ToggleAllButtonProps) => {
  const sectionColumnIds = SECTION_TO_COLUMN_IDS.get(section);
  const isAllVisible = sectionColumnIds.every(columnId => {
    if (COLUMNS_ALWAYS_PRESENT.includes(columnId as ColumnId)) {
      return true;
    }
    const columnName = COLUMN_ID_TO_NAME.get(columnId);
    return !!dropdownValue.find(option => option.name === columnName);
  });

  // Show or Hide all columns in a section
  const toggleAllColumnsInSection = (section: ColumnSection, show: boolean) => {
    const otherSectionOptions = dropdownValue.filter(options => {
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

    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
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
