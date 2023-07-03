import {
  ButtonIcon,
  DefaultDropdownMenuOption,
  DropdownMenu,
  Tooltip,
} from "@czi-sds/components";
import { Column, Table } from "@tanstack/react-table";
import { difference } from "lodash/fp";
import React, { useEffect, useState } from "react";
import { setState } from "~/helpers/storage";
import { SDSFormattedDropdownOption } from "~/interface/dropdown";
import {
  ColumnId,
  ColumnSection,
  COLUMN_ID_TO_NAME,
  LOCAL_STORAGE_AMR_COLUMN_VISIBILITY_KEY,
  SECTION_TO_COLUMN_IDS,
} from "../../../../constants";
import { AmrResult } from "../../types";
import { ToggleAllButton } from "./components/ToggleAllButton";
import cs from "./toggle_visible_columns_dropdown.scss";

interface ToggleVisibleColumnsDropdownProps {
  table: Table<any>;
}

export const formatDropdownOption = (
  column: Column<AmrResult, any>,
): SDSFormattedDropdownOption => {
  return {
    name: COLUMN_ID_TO_NAME.get(column.id),
    section: SECTION_TO_COLUMN_IDS.revGet(column.id),
  };
};

export const ToggleVisibleColumnsDropdown = ({
  table,
}: ToggleVisibleColumnsDropdownProps) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [dropdownValue, setDropdownValue] =
    useState<SDSFormattedDropdownOption[]>();

  const handleAnchorClick = (event: React.MouseEvent<HTMLElement>) => {
    if (isOpen) {
      setIsOpen(false);
      if (anchorEl) {
        anchorEl.focus();
      }
    } else {
      setAnchorEl(event.currentTarget);
      setIsOpen(true);
    }
  };

  // Use all leaf columns to generate the dropdown options.
  const allColumns = table.getAllLeafColumns();
  const dropdownOptions: SDSFormattedDropdownOption[] = [];
  allColumns.forEach(column => {
    if (column.id === "gene") {
      return;
    }
    dropdownOptions.push(formatDropdownOption(column));
  });

  // Get the visible columns from react-table - this is the source of truth
  // This returns a new object every time.
  const visibleColumns = table.getVisibleLeafColumns();
  useEffect(() => {
    // Convert visibleColumns to a list of SDSFormattedDropdownOptions to pass to the DropdownMenu
    const dropdownValue = [];
    [...visibleColumns].slice(1).forEach((column: Column<any, unknown>) => {
      dropdownValue.push(formatDropdownOption(column));
    });
    setDropdownValue(dropdownValue);
  }, [visibleColumns]);

  const onChange = (
    _: React.ChangeEvent<unknown>,
    options: SDSFormattedDropdownOption[],
  ) => {
    handleApply(options);
  };

  const persistColumnVisibilityToLocalStorage = (
    selectedColumnIds: string[],
  ) => {
    const allColumns = Object.values(ColumnId);
    const columnsAlwaysPresent = [ColumnId.GENE];

    setState(localStorage, LOCAL_STORAGE_AMR_COLUMN_VISIBILITY_KEY, {
      columnVisibility: difference(allColumns, columnsAlwaysPresent).reduce(
        (obj, columnId) => ({
          ...obj,
          [columnId]: selectedColumnIds.includes(columnId),
        }),
        {},
      ),
    });
  };

  const handleApply = (options: SDSFormattedDropdownOption[]) => {
    // Apply the changes by updating the visibility of the react-table columns
    const selectedColumnIds = options.map(option => {
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
    // TODO: This is an anti-pattern updating local state manually. Can we remove this
    // and use the react-table state instead?
    setDropdownValue(options);
    persistColumnVisibilityToLocalStorage(selectedColumnIds);
  };

  const handleClickAway = () => {
    // Close the DropdownMenu
    setIsOpen(false);
  };

  const handleKeyEscape = (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      // Close the DropdownMenu and return focus to the anchor element
      setIsOpen(false);
      if (anchorEl) {
        anchorEl.focus();
      }
    }
  };

  return (
    <>
      <Tooltip
        title="Show or hide columns"
        sdsStyle="dark"
        placement="top-end"
        width="default"
        arrow
      >
        <ButtonIcon
          onClick={handleAnchorClick}
          sdsIcon="plusCircle"
          sdsSize="small"
          sdsType="tertiary"
        />
      </Tooltip>
      <DropdownMenu
        title="Select Columns"
        open={isOpen}
        anchorEl={anchorEl}
        onChange={onChange}
        onClickAway={handleClickAway}
        onKeyDown={handleKeyEscape}
        options={dropdownOptions}
        value={dropdownValue}
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
                    dropdownValue={dropdownValue}
                    section={params.group as ColumnSection}
                    setPendingOptions={handleApply}
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
