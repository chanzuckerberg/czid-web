import React from 'react';
import ScatterPlot from './ScatterPlot';

class ERCCScatterPlot extends React.Component {
  render () {
    return (<ScatterPlot data={[[1,1], [1,1.5], [3, 1], [5,3], [6, 3.5], [2, 1], [2.2, 3]]} width={720} />)
  };
}

export default ERCCScatterPlot;
