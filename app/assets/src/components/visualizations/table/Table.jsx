import { difference, find, isEmpty, map, orderBy } from "lodash/fp";
import PropTypes from "prop-types";
import React, { useState, useEffect } from "react";
import { SortDirection } from "react-virtualized";

import BaseTable from "./BaseTable";

const Table = ({
  columns,
  data = [],
  draggableColumns,
  onColumnSort,
  onSelectRow,
  onSelectAllRows,
  selectableKey,
  selected = new Set(),
  sortable,
  defaultSortBy,
  defaultSortDirection,
  ...props
}) => {
  const [sortBy, setSortBy] = useState(defaultSortBy);
  const [sortDirection, setSortDirection] = useState(
    defaultSortDirection || SortDirection.ASC
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

  const isSelectAllChecked = () => {
    if (!selectableKey || !selected) return false;

    return (
      !isEmpty(data) &&
      isEmpty(difference(map(selectableKey, data), Array.from(selected)))
    );
  };

  let sortedData = data;
  if (sortable && sortBy) {
    const sortColumn = find({ dataKey: sortBy }, columns) || {};
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
        data
      );
    }
  }

  return (
    <BaseTable
      columns={columns}
      onSelectAllRows={onSelectAllRows}
      onSelectRow={onSelectRow}
      onSort={handleSort}
      rowCount={sortedData.length}
      rowGetter={({ index }) => sortedData[index]}
      selectAllChecked={isSelectAllChecked()}
      selected={selected}
      sortable={sortable}
      sortBy={sortBy}
      sortDirection={sortDirection}
      {...props}
    />
  );
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired,
      // sortFunction should have the following signature: sortFunction({ data, sortDirection }) => sortedData
      sortFunction: PropTypes.function,
    })
  ).isRequired,
  data: PropTypes.array,
  draggableColumns: PropTypes.bool,
  // This is supplemental to sortFunction since sortFunction is in render() and may be called without a user click.
  onColumnSort: PropTypes.func,
  onSelectRow: PropTypes.func,
  onSelectAllRows: PropTypes.func,
  selectableKey: PropTypes.string,
  selected: PropTypes.instanceOf(Set),
  sortable: PropTypes.bool,
  // Allows you to set a sort on table initialization, but still allows user to change the sort.
  defaultSortBy: PropTypes.string,
  defaultSortDirection: PropTypes.string,
};

export default Table;
