import React from 'react';
import Samples from './Samples';
class Home extends React.Component {
  render() {
    return (
      <div>
        <Samples {...this.props}/>
      </div>
    )
  }
}
export default Home;
