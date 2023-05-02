import { Column, Table } from "@tanstack/react-table";
import { ButtonIcon, DefaultDropdownMenuOption, DropdownMenu } from "czifui";
import React, { useMemo, useState } from "react";
import {
  ColumnSection,
  COLUMN_ID_TO_NAME,
  SECTION_TO_COLUMN_IDS,
} from "../../../../constants";
import { AmrResult } from "../../types";
import { ToggleAllButton } from "./components/ToggleAllButton";
import cs from "./toggle_visible_columns_dropdown.scss";

interface ToggleVisibleColumnsDropdownProps {
  table: Table<any>;
}
export interface FormattedDropdownOption {
  name: string;
  section?: string;
}

export const formatDropdownOption = (
  column: Column<AmrResult, any>,
): FormattedDropdownOption => {
  return {
    name: COLUMN_ID_TO_NAME.get(column.id),
    section: SECTION_TO_COLUMN_IDS.revGet(column.id),
  };
};

export const ToggleVisibleColumnsDropdown = ({
  table,
}: ToggleVisibleColumnsDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [open, setOpen] = useState(false);
  const handleAnchorClick = (event: React.MouseEvent<HTMLElement>) => {
    if (open) {
      setOpen(false);
      if (anchorEl) {
        anchorEl.focus();
      }
    } else {
      setAnchorEl(event.currentTarget);
      setOpen(true);
    }
  };

  // Use all leaf columns to generate the dropdown options.
  const allColumns = table.getAllLeafColumns();
  const dropdownOptions: FormattedDropdownOption[] = [];
  allColumns.forEach(column => {
    if (column.id === "gene" || column.id === "dropdown") {
      return;
    }
    dropdownOptions.push(formatDropdownOption(column));
  });

  // Get the visible columns from react-table - this is the source of truth
  // This returns a new object every time.
  const visibleColumns = table.getVisibleLeafColumns();

  // Convert visibleColumns to a list of FormattedDropdownOptions to pass to the DropdownMenu
  const dropdownValue = useMemo(() => {
    const newDropdownValue: FormattedDropdownOption[] = [];
    [...visibleColumns].slice(1).forEach((column: Column<any, unknown>) => {
      newDropdownValue.push(formatDropdownOption(column));
    });
    return newDropdownValue;
  }, [visibleColumns]);

  // Keep track of the changes that have happened while the menu is open
  const [pendingOptions, setPendingOptions] =
    useState<FormattedDropdownOption[]>(dropdownValue);

  const onChange = (
    _: React.ChangeEvent<unknown>,
    options: FormattedDropdownOption[],
  ) => {
    setPendingOptions(options);
  };

  const handleClickAway = () => {
    // Apply the changes by updating the visibility of the react-table columns
    const selectedColumnIds = pendingOptions.map(option => {
      return COLUMN_ID_TO_NAME.revGet(option.name);
    });
    dropdownOptions.forEach(option => {
      const columnId = COLUMN_ID_TO_NAME.revGet(option.name);
      const column = table.getColumn(columnId);
      // if the column is not visible and the option is in options, then show the column
      if (!column?.getIsVisible() && selectedColumnIds.includes(columnId)) {
        column?.toggleVisibility(true);
      }
      // if the column is visible and the option is not in options, then hide the column
      else if (
        column?.getIsVisible() &&
        !selectedColumnIds.includes(columnId)
      ) {
        column?.toggleVisibility(false);
      }
    });

    // Close the DropdownMenu
    setOpen(false);
    if (anchorEl) {
      anchorEl.focus();
    }
  };

  return (
    <>
      <ButtonIcon
        onClick={handleAnchorClick}
        sdsIcon="plusCircle"
        sdsSize="small"
      />
      <DropdownMenu
        open={open}
        anchorEl={anchorEl}
        onChange={onChange}
        onClickAway={handleClickAway}
        options={dropdownOptions}
        value={pendingOptions}
        multiple
        groupBy={(option: DefaultDropdownMenuOption) =>
          option.section as string
        }
        renderGroup={function renderGroup(params) {
          return (
            <div key={params.key} className={cs.sectionWrapper}>
              <div className={cs.titleWrapper}>
                <div className={cs.titleText}>{params.group}</div>
                {
                  <ToggleAllButton
                    dropdownOptions={dropdownOptions}
                    pendingOptions={pendingOptions}
                    section={params.group as ColumnSection}
                    setPendingOptions={setPendingOptions}
                  />
                }
              </div>
              <div>{params.children}</div>
            </div>
          );
        }}
      />
    </>
  );
};
