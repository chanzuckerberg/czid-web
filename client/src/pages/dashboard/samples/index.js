import React from 'react';
import SampleList from '../../../components/sampleList';
import { connectToStore } from '../../../lib/utils';

class PipelineOutputs extends Component {

  componentDidMount() {
    this.props.getAllOutputs();
    console.log(this.props.allPipelineOutputs, 'all outputs');
  }

  render() {
    return (
      <div className="container samples-page">
        <SampleList />
      </div>
    )
  }
}

export default connectToStore(PipelineOutputs);

