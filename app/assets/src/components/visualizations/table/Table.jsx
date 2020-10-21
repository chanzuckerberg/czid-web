import React from "react";
import PropTypes from "prop-types";
import { difference, find, isEmpty, map, orderBy } from "lodash/fp";
import { SortDirection } from "react-virtualized";

import BaseTable from "./BaseTable";

class Table extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortBy: this.props.defaultSortBy,
      sortDirection: this.props.defaultSortDirection || SortDirection.ASC,
    };
  }

  handleSort = ({ sortBy, sortDirection }) => {
    this.setState({
      sortBy,
      sortDirection,
    });
  };

  handleGetRow = ({ index }) => {
    return this.sortedData[index];
  };

  isSelectAllChecked = () => {
    const { data, selectableKey, selected } = this.props;

    if (!selectableKey || !selected) return false;

    return (
      !isEmpty(data) &&
      isEmpty(difference(map(selectableKey, data), Array.from(selected)))
    );
  };

  render() {
    const {
      columns,
      data,
      onSelectRow,
      onSelectAllRows,
      selected,
      sortable,
      ...tableProps
    } = this.props;

    const { sortBy, sortDirection } = this.state;

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

    const selectAllChecked = this.isSelectAllChecked();
    return (
      <BaseTable
        columns={columns}
        onSelectAllRows={onSelectAllRows}
        onSelectRow={onSelectRow}
        onSort={this.handleSort}
        rowCount={sortedData.length}
        rowGetter={({ index }) => sortedData[index]}
        selectAllChecked={selectAllChecked}
        selected={selected}
        sortable={sortable}
        sortBy={sortBy}
        sortDirection={sortDirection}
        {...tableProps}
      />
    );
  }
}

Table.defaultProps = {
  data: [],
  selected: new Set(),
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
