import React from "react";
import PropTypes from "prop-types";
// import BaseTable from "./BaseTable";
import { InfiniteLoader, Table as VirtualizedTable } from "react-virtualized";

class InfiniteTable extends React.Component {
  constructor(props) {
    super(props);

    this.rows = [];
  }

  // isRowLoaded = ({ index }) => {
  isRowLoaded = args => {
    console.log("isRowLoaded", args);
    return !!this.rows[args.index];
  };

  loadMoreRows = async args => {
    console.log("loadMoreRows", args);
    const { onLoadRows } = this.props;
    const data = onLoadRows(args);
    console.log("loadMoreRows:data", data);
  };

  // rowRenderer={this.rowRenderer}
  // rowRenderer = ({key, index, style}) => {
  // rowRenderer = (args) => {
  //   console.log("rowRenderer", args);
  //   const {key, index, style} = args;
  //   return (
  //     <div
  //       key={key}
  //       style={style}
  //     >
  //       {this.data[index]}
  //     </div>
  //   )
  // }

  getRow = ({ index }) => {
    console.log("get row", index);
    return this.rows[index];
  };

  render() {
    const { minimumBatchSize, onGetRows, ...baseTableProps } = this.props;
    // rowCount={this.remoteRowCount}
    let rowCount = 1000;
    return (
      <div style={{ border: "1px solid blue" }}>
        <InfiniteLoader
          isRowLoaded={this.isRowLoaded}
          loadMoreRows={this.loadMoreRows}
          minimumBatchSize={minimumBatchSize}
          rowCount={rowCount}
        >
          {({ onRowsRendered, registerChild }) => (
            <VirtualizedTable
              height={500}
              onRowsRendered={onRowsRendered}
              forwardRef={registerChild}
              rowCount={rowCount}
              rowGetter={this.getRow}
              rowHeight={50}
              width={300}
            />
          )}
        </InfiniteLoader>
      </div>
    );
  }
}

InfiniteTable.defaultProps = {
  minimumBatchSize: 100
};

InfiniteTable.propTypes = {
  minimumBatchSize: PropTypes.number,
  onLoadRows: PropTypes.func
};

export default InfiniteTable;
