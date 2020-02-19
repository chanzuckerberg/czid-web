import React from "react";
import PropTypes from "prop-types";
import { defaultTableRowRenderer, InfiniteLoader } from "react-virtualized";
import { isObject } from "lodash/fp";
import BaseTable from "./BaseTable";
import cs from "./infinite_table.scss";
import cx from "classnames";

const STATUS_LOADING = 1;
const STATUS_LOADED = 2;

class CanceledPromiseError extends Error {
  constructor(promise, ...params) {
    super(...params);
    this.promise = promise;
  }
}

const makeCancelable = promise => {
  let hasCanceled_ = false;

  const wrappedPromise = new Promise((resolve, reject) => {
    promise.then(
      val =>
        hasCanceled_ ? reject(new CanceledPromiseError(promise)) : resolve(val),
      error =>
        hasCanceled_ ? reject(new CanceledPromiseError(promise)) : reject(error)
    );
  });

  return {
    promise: wrappedPromise,
    cancel() {
      hasCanceled_ = true;
    },
  };
};

class InfiniteTable extends React.Component {
  // Encapsulates Table in an InfiniteLoader component.
  // Keeps track of rows for which a load request was made, to avoid requesting the same row twice.
  // ATTENTION: This class does not automatically reload rows if data changes.
  //            Reset function must be called explicitly by the client.
  //            This happens also because react virtualized memoizes responses and
  //            may not ask for the rows again.

  constructor(props) {
    super(props);

    this.rows = [];
    this.loadedRowsMap = [];
    this.state = {
      rowCount: this.props.rowCount,
    };

    this.cancelableLoadRowsPromise = null;
  }

  componentWillUnmount = () => {
    if (this.cancelableLoadRowsPromise) {
      this.cancelableLoadRowsPromise.cancel();
    }
  };

  isRowLoadingOrLoaded = ({ index }) => {
    return !!this.loadedRowsMap[index];
  };

  loadMoreRows = async ({ startIndex, stopIndex }) => {
    const { onLoadRows, minimumBatchSize, customSampleSortFn } = this.props;

    for (let i = startIndex; i <= stopIndex; i++) {
      this.loadedRowsMap[i] = STATUS_LOADING;
    }

    this.cancelableLoadRowsPromise = makeCancelable(
      onLoadRows({ startIndex, stopIndex })
    );
    this.cancelableLoadRowsPromise.promise
      .then(newRows => {
        const requestedNumberOfRows = stopIndex - startIndex + 1;
        this.rows.splice(startIndex, requestedNumberOfRows, ...newRows);
        if (customSampleSortFn) {
          this.rows = customSampleSortFn(this.rows);
        }

        if (requestedNumberOfRows !== newRows.length) {
          this.setState({ rowCount: this.rows.length });
        } else {
          this.setState({ rowCount: this.rows.length + minimumBatchSize });
        }

        for (let i = startIndex; i <= stopIndex; i++) {
          this.loadedRowsMap[i] = STATUS_LOADED;
        }

        this.cancelableLoadRowsPromise = null;
        return true;
      })
      .catch(error => {
        // eslint-disable-next-line no-console
        console.error("Error loading rows", error);
      });
    return this.cancelableLoadRowsPromise.promise;
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
        {/* Use .name if val is an object (e.g. location object) */}
        {cellData == null
          ? ""
          : isObject(cellData)
            ? cellData.name
            : String(cellData)}
      </div>
    );
  };

  handleGetRowHeight = ({ index }) => {
    const { defaultRowHeight } = this.props;
    const height =
      typeof defaultRowHeight === "function"
        ? defaultRowHeight({ index, row: this.rows[index] })
        : defaultRowHeight;
    return height;
  };

  reset = () => {
    // Reset function MUST be called if previously loaded data changes
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
      onSelectRow,
      onSelectAllRows,
      defaultRowHeight,
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
              onSelectAllRows={onSelectAllRows}
              onSelectRow={onSelectRow}
              rowCount={rowCount}
              rowGetter={this.getRow}
              rowHeight={this.handleGetRowHeight}
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
  threshold: 50,
};

InfiniteTable.propTypes = {
  defaultCellRenderer: PropTypes.func,
  loadingClassName: PropTypes.string,
  minimumBatchSize: PropTypes.number,
  // function that retrieves rows from startIndex to stopIndex (inclusive),
  // if it returns less rows than requested, InfiniteTable interprets that
  // as end of page
  onLoadRows: PropTypes.func,
  onSelectRow: PropTypes.func,
  onSelectAllRows: PropTypes.func,
  rowCount: PropTypes.number,
  defaultRowHeight: PropTypes.oneOfType([PropTypes.number, PropTypes.func]),
  threshold: PropTypes.number,
  // Sort the rows after they are fetched. This is a hack to allow for specifying a particular order for the
  customSampleSortFn: PropTypes.func,
};

export default InfiniteTable;
