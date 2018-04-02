import React from 'react';
import ScatterPlot from './ScatterPlot';

class ERCCScatterPlot extends React.Component {
  render () {
    let data = [];
    for (let row of this.props.ercc_comparison) {
      if (row.actual == 0) {
        continue;
      }
      data.push({
        name: row.name,
        actual: Math.log10(row.actual),
        expected: Math.log10(row.expected),
      });
    }
    return (<ScatterPlot data={data} xKey="expected" yKey="actual" width={720} xLabel="log10 spike in concetrations" yLabel="log10 read-pairs per gene" />)
  };
}

export default ERCCScatterPlot;
