import React from "react";
import PropTypes from "prop-types";
import { getSamples } from "~/api";
import InfiniteTable from "../../visualizations/table/InfiniteTable";

class SamplesView extends React.Component {
  pageNumber = 0;
  columns = [
    {
      dataKey: "public_access",
      width: 30,
      label: "Privacy",
      cellRenderer: this.renderAccess
    },
    {
      dataKey: "name",
      label: "Sample",
      flexGrow: 1
    }
  ];

  handleLoadRows({ startIndex, stopIndex }) {
    const { excludeLibrary, onlyLibrary, pageSize } = this.props;
    const { pageNumber } = this.state;
    console.log("handleLoadRows", a, b, c, d);

    // let samples = getSamples({
    //   excludeLibrary,
    //   onlyLibrary,
    //   pageNumber,
    //   pageSize
    // });
    // console.log(samples);
    // return samples;
  }

  render() {
    return (
      <div>
        <InfiniteTable
          columns={this.columns}
          onLoadRows={this.handleLoadRows}
        />
        <div>
          Internal class not fully implemented!.{" "}
          <a href="/samples">Current samples view</a>
        </div>
      </div>
    );
  }
}

SamplesView.defaultProps = {
  pageSize: 30
};

SamplesView.propTypes = {
  excludeLibrary: PropTypes.bool,
  onlyLibrary: PropTypes.bool,
  pageNumber: PropTypes.number,
  pageSize: PropTypes.number
};

export default SamplesView;
