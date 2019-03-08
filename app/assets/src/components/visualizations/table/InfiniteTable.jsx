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
    this.loadedRowsMap = [];
    this.state = {
      rowCount: this.props.rowCount
    };
  }

  isRowLoadingOrLoaded = ({ index }) => {
    return !!this.loadedRowsMap[index];
  };

  loadMoreRows = async ({ startIndex, stopIndex }) => {
    const { onLoadRows, minimumBatchSize } = this.props;

    for (var i = startIndex; i <= stopIndex; i++) {
      this.loadedRowsMap[i] = STATUS_LOADING;
    }

    const newRows = await onLoadRows({ startIndex, stopIndex });
    const requestedNumberOfRows = stopIndex - startIndex + 1;
    this.rows.splice(startIndex, requestedNumberOfRows, ...newRows);

    if (requestedNumberOfRows != newRows.length) {
      this.setState({ rowCount: this.rows.length });
    } else {
      this.setState({ rowCount: this.rows.length + minimumBatchSize });
    }

    for (i = startIndex; i <= stopIndex; i++) {
      this.loadedRowsMap[i] = STATUS_LOADED;
    }

    return true;
  };

  getRow = ({ index }) => {
    return this.rows[index] || {};
  };

  rowRenderer = rowProps => {
    const { loadingClassName } = this.props;
    if (!this.rows[rowProps.index]) {
      rowProps.className = cx(rowProps.className, cs.loading, loadingClassName);
    }

    return defaultTableRowRenderer(rowProps);
  };

  defaultCellRenderer = ({ cellData }) => {
    // Guarantees that we have at least one child div in the cell
    return (
      <div className={cs.cellContent}>
        {cellData == null ? "" : String(cellData)}
      </div>
    );
  };

  reset = () => {
    const { rowCount } = this.props;
    this.rows = [];
    this.loadedRowsMap = [];
    this.setState(
      { rowCount },
      // reset infinite loader cache with autoReload
      () => this.infiniteLoader.resetLoadMoreRowsCache(true)
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
        ref={infiniteLoader => (this.infiniteLoader = infiniteLoader)}
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
