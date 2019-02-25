import React from "react";
import PropTypes from "prop-types";
import { find, orderBy } from "lodash";
import { SortDirection } from "react-virtualized";
import cx from "classnames";

import { humanize } from "~/helpers/strings";

import BaseTable from "./BaseTable";
import cs from "./table.scss";

class Table extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      sortBy: this.props.sortBy,
      sortDirection: this.props.sortDirection || SortDirection.ASC
    };
  }

<<<<<<< HEAD
  handleSort = ({ sortBy, sortDirection }) => {
    this.setState({
      sortBy,
      sortDirection
=======
  setDefaults = columns => {
    const { defaultColumnWidth } = this.props;
    return columns.map(column => {
      column.label =
        column.label !== undefined ? column.label : humanize(column.dataKey);
      column.width = column.width || defaultColumnWidth;
      return column;
>>>>>>> extract humanize
    });
  };

  handleGetRow = ({ index }) => {
    return this.sortedData[index];
  };

  render() {
    const { columns, data, sortable, ...tableProps } = this.props;

    const { sortBy, sortDirection } = this.state;

    const columnSortFunction = (find(columns, { dataKey: sortBy }) || {})
      .sortFunction;

    const sortedData =
      sortable && sortBy
        ? orderBy(
            this.props.data,
            [
              columnSortFunction
                ? row => columnSortFunction(row[sortBy])
                : sortBy
            ],
            [sortDirection === SortDirection.ASC ? "asc" : "desc"]
          )
        : data;

    return (
      <BaseTable
        columns={columns}
        onSort={this.handleSort}
        rowCount={sortedData.length}
        rowGetter={({ index }) => sortedData[index]}
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
  sortable: PropTypes.bool,
  sortBy: PropTypes.string,
  sortDirection: PropTypes.string
};

export default Table;
