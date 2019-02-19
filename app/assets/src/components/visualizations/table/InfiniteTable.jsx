import React from "react";
import PropTypes from "prop-types";
import { defaultTableRowRenderer, InfiniteLoader } from "react-virtualized";
import BaseTable from "./BaseTable";
import cs from "./infinite_table.scss";

const STATUS_LOADING = 1;
const STATUS_LOADED = 2;

class InfiniteTable extends React.Component {
  // Encapsulates Table in an InfiniteLoader component.
  // - Keeps track of rows for which a load request was made,
  //   to avoid requesting the same row twice.
  // TODO: Current limitations:
  // - does not reload rows if they change; this needs to be addressed,
  //   by having a clear function for certain or all rows that client will
  //   through a ref to the component.

  constructor(props) {
    super(props);

    this.rows = [];
    // TODO: optimize by not requesting the same row over and over

    (this.loadedRowsMap = []),
      (this.state = {
        rowCount: this.props.rowCount
      });
  }

  _isRowLoadingOrLoaded = ({ index }) => {
    // console.log("InfiniteTable::_isRowLoaded", index, !!this.rows[index]);
    return !!this.loadedRowsMap[index];
  };

  _loadMoreRows = async ({ startIndex, stopIndex }) => {
    console.log("InfiniteTable::_loadMoreRows:start", startIndex, stopIndex);
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

  _getRow = ({ index }) => {
    // console.log("InfiniteTable::_getRow", this.rows[index], this.rows[index] || {});
    return this.rows[index] || {};
  };

  _rowRenderer = args => {
    const { index, key, style } = args;

    if (this.rows[index]) {
      return defaultTableRowRenderer(args);
    }

    return (
      <div className={cs.row} key={key} style={style}>
        loading...
      </div>
    );
  };

  render() {
    const { minimumBatchSize, threshold, ...extraProps } = this.props;

    const { rowCount } = this.state;

    return (
      <InfiniteLoader
        isRowLoaded={this._isRowLoadingOrLoaded}
        loadMoreRows={this._loadMoreRows}
        minimumBatchSize={minimumBatchSize}
        rowCount={rowCount}
        threshold={threshold}
      >
        {({ onRowsRendered, registerChild }) => {
          return (
            <BaseTable
              {...extraProps}
              forwardRef={registerChild}
              onRowsRendered={onRowsRendered}
              rowCount={rowCount}
              rowGetter={this._getRow}
              rowRenderer={this._rowRenderer}
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
  minimumBatchSize: PropTypes.number,
  // function that retrieves rows from startIndex to stopIndex (inclusive),
  // if it returns less rows than requested, InfiniteTable interprets that
  // as end of page
  onLoadRows: PropTypes.func,
  rowCount: PropTypes.number,
  threshold: PropTypes.number
};

export default InfiniteTable;
