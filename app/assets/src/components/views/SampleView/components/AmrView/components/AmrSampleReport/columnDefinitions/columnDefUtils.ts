import { ColumnDef, Table } from "@tanstack/react-table";
import { loadState, setState } from "~/helpers/storage";
import {
  ColumnId,
  ColumnSection,
  LOCAL_STORAGE_AMR_COLUMN_VISIBILITY_KEY,
  SECTION_TO_COLUMN_IDS,
} from "../../../constants";
import { AmrResult } from "../types";

const isColumnVisible = (columnId: string, table?: Table<any>) => {
  const column = table?.getColumn(columnId);
  return column?.getIsVisible();
};

// Check to see if all columns in the section are visible
// if so - the section is open (show close arrows),
// otherwise - it's closed (show open arrows)
export const isAllColumnsVisible = (
  columns: ColumnDef<AmrResult, any>[],
  table: Table<any>,
): boolean => {
  const columnIds = columns?.map(column => column?.id);
  return columnIds?.every(columnId => {
    return isColumnVisible(columnId, table);
  });
};

export const persistColumnVisibilityToLocalStorage = (
  visibleColumnIds: ColumnId[],
  columnGroup: ColumnSection | "ALL" = "ALL",
) => {
  const allColumnIds =
    columnGroup === "ALL"
      ? Object.values(ColumnId)
      : (SECTION_TO_COLUMN_IDS.get(columnGroup) as ColumnId[]);

  // Since the column group toggles only affect one column group,
  // we need to get the other visibility info from the current local storage
  const currentLocalStorage = loadState(
    localStorage,
    LOCAL_STORAGE_AMR_COLUMN_VISIBILITY_KEY,
  );

  setState(localStorage, LOCAL_STORAGE_AMR_COLUMN_VISIBILITY_KEY, {
    columnVisibility: allColumnIds.reduce(
      (obj, columnId) => ({
        ...obj,
        [columnId]: visibleColumnIds?.includes(columnId),
      }),
      currentLocalStorage?.columnVisibility,
    ),
  });
};

export const handleSectionOpenToggled = (
  table: Table<any>,
  sectionWasOpen: boolean,
  columnGroup: ColumnSection,
) => {
  // Apply the changes by updating the visibility of the react-table columns
  const columnIds = SECTION_TO_COLUMN_IDS.get(columnGroup);

  // Keep track of visible columns so we can persist them to local storage
  const updatedVisibleColumnIds = [];

  columnIds.forEach((columnId, idx) => {
    const column = table.getColumn(columnId);
    // if the section was closed, open it back up by setting all columns to be visible
    // Section toggles do not affect the first column in the section
    if (!sectionWasOpen || idx === 0) {
      column?.toggleVisibility(true);
      updatedVisibleColumnIds.push(columnId);
    }
    // if the section was open, collapse it by hiding all but the first column.
    else if (sectionWasOpen && idx !== 0) {
      column?.toggleVisibility(false);
    }
  });
  persistColumnVisibilityToLocalStorage(updatedVisibleColumnIds, columnGroup);
};
