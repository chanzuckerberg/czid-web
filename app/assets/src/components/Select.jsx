import React from 'react';
import SelectSamples from './SelectSamples';

class Select extends React.Component {
  render() {
    return (
      <div>
        <SelectSamples {...this.props}/>
      </div>
    )
  }
}

export default Select;
