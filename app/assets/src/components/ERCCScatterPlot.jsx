import React from "react";
import ScatterPlot from "./ScatterPlot";
import PropTypes from "~/components/utils/propTypes";
import cs from "./ercc_scatterplot.scss";

class ERCCScatterPlot extends React.Component {
  render() {
    let data = [];
    for (let row of this.props.ercc_comparison) {
      if (row.actual == 0) {
        continue;
      }
      data.push({
        name: row.name,
        actual: Math.log10(row.actual),
        expected: Math.log10(row.expected)
      });
    }

    if (!data.length) {
      return <div className={cs.noData}>No data</div>;
    }

    return (
      <ScatterPlot
        data={data}
        xKey="expected"
        yKey="actual"
        width={this.props.width}
        height={this.props.height}
        xLabel="log10 spike in concetrations"
        yLabel="log10 read-pairs per gene"
      />
    );
  }
}

ERCCScatterPlot.propTypes = {
  width: PropTypes.number,
  height: PropTypes.number,
  ercc_comparison: PropTypes.ERCCComparison
};

export default ERCCScatterPlot;
