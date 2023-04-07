import { difference, find, isEmpty, map, orderBy } from "lodash/fp";
import React, { useEffect, useState } from "react";
import {
  SortDirection,
  SortDirectionType,
  TableRowProps,
} from "react-virtualized";
import BaseTable, { BaseTableProps } from "./BaseTable";

interface Column {
  sortKey?: string;
  dataKey?: string;
  sortFunction?: ({
    data,
    sortDirection,
  }: {
    data: $TSFixMe[];
    sortDirection: string;
  }) => $TSFixMe[];
}
interface TableProps extends BaseTableProps {
  columns: Column[];
  data?: $TSFixMeUnknown[];
  draggableColumns?: boolean;
  // This is supplemental to sortFunction since sortFunction is in render() and may be called without a user click.
  onColumnSort?: $TSFixMeFunction;
  onSelectRow?: $TSFixMeFunction;
  onSelectAllRows?: $TSFixMeFunction;
  selectableKey?: string;
  selected?: Set<$TSFixMeUnknown>;
  sortable?: boolean;
  // Allows you to set a sort on table initialization, but still allows user to change the sort.
  defaultSortBy?: string;
  defaultSortDirection?: SortDirectionType;
  // Allows to set a custom row height function that receives the row data, not just the ID
  defaultRowHeight?:
    | number
    | ((index: { index: number; row: $TSFixMe }) => number);
  selectRowDataGetter?: $TSFixMeFunction;
  rowRenderer?: (rowProps: TableRowProps) => React.ReactNode;
}

const Table = ({
  columns,
  data = [],
  onColumnSort,
  onSelectRow,
  onSelectAllRows,
  selectableKey,
  selected = new Set(),
  sortable,
  defaultSortBy,
  defaultSortDirection,
  defaultRowHeight,
  selectRowDataGetter,
  rowRenderer,
  ...props
}: TableProps) => {
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortDirection, setSortDirection] = useState(
    defaultSortDirection || SortDirection.ASC,
  );

  useEffect(() => {
    defaultSortBy && setSortBy(defaultSortBy);
  }, [defaultSortBy]);

  const handleSort = ({ sortBy, sortDirection }) => {
    setSortBy(sortBy);
    setSortDirection(sortDirection);
    onColumnSort &&
      onColumnSort({
        sortBy,
        sortDirection,
      });
  };

  const handleGetRowHeight = ({ index }: { index: number }) => {
    return typeof defaultRowHeight === "function"
      ? defaultRowHeight({ index, row: sortedData[index] })
      : defaultRowHeight;
  };

  const isSelectAllChecked = () => {
    if (!selectableKey || !selected) return false;

    return (
      !isEmpty(data) &&
      isEmpty(difference(map(selectableKey, data), Array.from(selected)))
    );
  };

  let sortedData = data;
  if (sortable && sortBy) {
    const sortColumn: Column = find({ dataKey: sortBy }, columns) || {};
    const sortDirectionStr =
      sortDirection === SortDirection.ASC ? "asc" : "desc";
    if (sortColumn.sortFunction) {
      sortedData = sortColumn.sortFunction({
        data,
        sortDirection: sortDirectionStr,
      });
    } else {
      sortedData = orderBy(
        sortColumn.sortKey || sortBy,
        [sortDirectionStr],
        data,
      );
    }
  }

  return (
    <BaseTable
      columns={columns}
      defaultRowHeight={handleGetRowHeight}
      onSelectAllRows={onSelectAllRows}
      onSelectRow={onSelectRow}
      onSort={handleSort}
      rowCount={sortedData.length}
      rowGetter={({ index }) => sortedData[index]}
      selectableKey={selectableKey}
      selectAllChecked={isSelectAllChecked()}
      selected={selected}
      sortable={sortable}
      rowRenderer={rowRenderer}
      sortBy={sortBy}
      sortDirection={sortDirection}
      selectRowDataGetter={selectRowDataGetter}
      {...props}
    />
  );
};

export default Table;
