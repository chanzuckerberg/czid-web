import React from "react";
import PropTypes from "prop-types";
import { difference, find, isEmpty, map, orderBy } from "lodash/fp";
import { SortDirection } from "react-virtualized";

import BaseTable from "./BaseTable";

class Table extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortBy: this.props.sortBy,
      sortDirection: this.props.sortDirection || SortDirection.ASC
    };
  }

  handleSort = ({ sortBy, sortDirection }) => {
    this.setState({
      sortBy,
      sortDirection
    });
  };

  handleGetRow = ({ index }) => {
    return this.sortedData[index];
  };

  isSelectAllChecked = () => {
    const { data, selectableKey, selected } = this.props;
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

    const columnSortFunction = (find({ dataKey: sortBy }, columns) || {})
      .sortFunction;

    const sortedData =
      sortable && sortBy
        ? orderBy(
            [
              columnSortFunction
                ? row => columnSortFunction(row[sortBy])
                : sortBy
            ],
            [sortDirection === SortDirection.ASC ? "asc" : "desc"],
            this.props.data
          )
        : data;

    const selectAllChecked = this.isSelectAllChecked();
    console.log("Table:render", selectAllChecked);
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
  data: []
};

Table.propTypes = {
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      dataKey: PropTypes.string.isRequired
    })
  ).isRequired,
  data: PropTypes.array,
  onSelectRow: PropTypes.func,
  onSelectAllRows: PropTypes.func,
  selectableKey: PropTypes.string,
  selected: PropTypes.instanceOf(Set),
  sortable: PropTypes.bool,
  sortBy: PropTypes.string,
  sortDirection: PropTypes.string
};

export default Table;
