import {
  Column,
  ColumnDef,
  CoreCell,
  Header,
  RowSelectionRow,
  Table,
} from "@tanstack/react-table";
import { CellComponent, CellHeader, InputCheckbox } from "czifui";
import React from "react";
import { generateWidthStyles } from "../../tableUtils";
import cs from "./row_selection_column.scss";

// Note: this is a React Table column definition, not a component
export const rowSelectionColumn: ColumnDef<any, any> = {
  id: "select",
  size: 40,
  minSize: 40,
  maxSize: 40,
  header: function RowSelectionHeader({
    table,
    column,
    header,
  }: {
    table: Table<any>;
    column: Column<any, any>;
    header: Header<any, any>;
  }) {
    const {
      getIsAllRowsSelected,
      getIsSomeRowsSelected,
      getToggleAllRowsSelectedHandler,
    } = table;
    const isChecked = getIsAllRowsSelected();
    const isIndeterminate = getIsSomeRowsSelected();
    const checkboxStage = isChecked
      ? "checked"
      : isIndeterminate
      ? "indeterminate"
      : "unchecked";

    const onChange = getToggleAllRowsSelectedHandler();

    return (
      <CellHeader
        key={header.id}
        hideSortIcon
        style={generateWidthStyles(column)}>
        <InputCheckbox
          className={cs.inputCheckbox}
          stage={checkboxStage}
          onChange={onChange}
        />
      </CellHeader>
    );
  },
  cell: function RowSelectionCell({
    row,
    cell,
  }: {
    row: RowSelectionRow;
    cell: CoreCell<any, any>;
  }) {
    const { getIsSelected, getToggleSelectedHandler } = row;

    const checkboxStage = getIsSelected() ? "checked" : "unchecked";
    const onChange = getToggleSelectedHandler();

    return (
      <CellComponent key={cell.id}>
        <InputCheckbox stage={checkboxStage} onChange={onChange} />
      </CellComponent>
    );
  },
};
