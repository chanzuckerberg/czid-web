import React from "react";
import PropTypes from "prop-types";
import { defaultTableRowRenderer, InfiniteLoader } from "react-virtualized";
import BaseTable from "./BaseTable";
import cs from "./infinite_table.scss";
import cx from "classnames";

const STATUS_LOADING = 1;
const STATUS_LOADED = 2;

class InfiniteTable extends React.Component {
  // Encapsulates Table in an InfiniteLoader component.
  // - Keeps track of rows for which a load request was made,
  //   to avoid requesting the same row twice.
  // TODO(tiago): Current limitations:
  // - does not reload rows if they change; this can be addressed,
  //   by having a function to clear some or all rows that client can call
  //   through a ref to the component.

  constructor(props) {
    super(props);

    this.rows = [];

    (this.loadedRowsMap = []),
      (this.state = {
        rowCount: this.props.rowCount
      });
  }

  isRowLoadingOrLoaded = ({ index }) => {
    // console.log("InfiniteTable::isRowLoaded", index, !!this.rows[index]);
    return !!this.loadedRowsMap[index];
  };

  loadMoreRows = async ({ startIndex, stopIndex }) => {
    console.log("InfiniteTable::loadMoreRows:start", startIndex, stopIndex);
    const { onLoadRows, minimumBatchSize } = this.props;

    for (var i = startIndex; i <= stopIndex; i++) {
      this.loadedRowsMap[i] = STATUS_LOADING;
    }

    const newRows = await onLoadRows({ startIndex, stopIndex });
    const requestedNumberOfRows = stopIndex - startIndex + 1;

    this.rows.splice(startIndex, requestedNumberOfRows, ...newRows);

    if (requestedNumberOfRows != newRows.length) {
      console.log("setting row count to current", this.rows.length);
      this.setState({ rowCount: this.rows.length });
    } else {
      console.log(
        "setting row count to new length",
        this.rows.length + minimumBatchSize
      );
      this.setState({ rowCount: this.rows.length + minimumBatchSize });
    }

    for (i = startIndex; i <= stopIndex; i++) {
      this.loadedRowsMap[i] = STATUS_LOADED;
    }

    return true;
  };

  getRow = ({ index }) => {
    // console.log("InfiniteTable::getRow", this.rows[index], this.rows[index] || {});
    return this.rows[index] || {};
  };

  rowRenderer = rowProps => {
    const { loadingClassName } = this.props;
    console.log(rowProps);
    if (!this.rows[rowProps.index]) {
      rowProps.className = cx(rowProps.className, cs.loading, loadingClassName);
    }

    return defaultTableRowRenderer(rowProps);
  };

  defaultCellRenderer = ({ cellData }) => {
    // Guarantees that we have at least one child div in the cell
    console.log("in defaultCellRenderer", cellData);
    return (
      <div className={cs.cellContent}>
        {cellData == null ? "" : String(cellData)}
      </div>
    );
  };

  render() {
    const {
      defaultCellRenderer,
      minimumBatchSize,
      threshold,
      ...extraProps
    } = this.props;

    const { rowCount } = this.state;

    return (
      <InfiniteLoader
        isRowLoaded={this.isRowLoadingOrLoaded}
        loadMoreRows={this.loadMoreRows}
        minimumBatchSize={minimumBatchSize}
        rowCount={rowCount}
        threshold={threshold}
      >
        {({ onRowsRendered, registerChild }) => {
          return (
            <BaseTable
              {...extraProps}
              defaultCellRenderer={
                defaultCellRenderer || this.defaultCellRenderer
              }
              forwardRef={registerChild}
              onRowsRendered={onRowsRendered}
              rowCount={rowCount}
              rowGetter={this.getRow}
              rowRenderer={this.rowRenderer}
            />
          );
        }}
      </InfiniteLoader>
    );
  }
}

InfiniteTable.defaultProps = {
  minimumBatchSize: 50,
  // should be at least as high as the minimumBatchSize
  rowCount: 50,
  threshold: 50
};

InfiniteTable.propTypes = {
  defaultCellRenderer: PropTypes.func,
  loadingClassName: PropTypes.string,
  minimumBatchSize: PropTypes.number,
  // function that retrieves rows from startIndex to stopIndex (inclusive),
  // if it returns less rows than requested, InfiniteTable interprets that
  // as end of page
  onLoadRows: PropTypes.func,
  rowCount: PropTypes.number,
  threshold: PropTypes.number
};

export default InfiniteTable;
