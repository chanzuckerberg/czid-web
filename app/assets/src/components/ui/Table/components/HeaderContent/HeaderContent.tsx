import { flexRender, Table } from "@tanstack/react-table";
import { TableRow, TableRowProps } from "czifui";
import React from "react";

interface HeaderContentProps {
  table: Table<any>;
  tableRowComponent?: React.ComponentType<TableRowProps>;
}

export const HeaderContent = ({
  table,
  tableRowComponent,
}: HeaderContentProps) => {
  const TableRowComponent = tableRowComponent || TableRow;

  /*
    In order to style the header groups (parent headers) and headers (child headers) differently,
    we are not mapping over the headerGroups array, but instead accessing each headerGroup
    individually. If we want more levels of nested headers, this will need to be updated.

    Docs for table.getHeaderGroups(): https://tanstack.com/table/v8/docs/api/core/table#getheadergroups
    table.getHeaderGroups() returns the headers based on "depth".
    [
      { depth: 0, headers: [parentHeader1, parentHeader2, ...] },
      { depth: 1, headers: [childHeader1, childHeader2, ...] },
    ]
  */
  const headerGroups = table.getHeaderGroups();

  const parentHeaders = headerGroups[0];
  const childHeaders = headerGroups[1];
  return (
    <>
      <tr
        key={`header-depth-${parentHeaders.depth}`}
        style={{ background: "white", width: "100%" }}
      >
        {parentHeaders.headers.map(header =>
          flexRender(header.column.columnDef.header, header.getContext()),
        )}
      </tr>
      <TableRowComponent
        key={`header-depth-${childHeaders.depth}`}
        style={{ background: "white", width: "100%" }}
      >
        {childHeaders.headers.map(header =>
          flexRender(header.column.columnDef.header, header.getContext()),
        )}
      </TableRowComponent>
    </>
  );
};
