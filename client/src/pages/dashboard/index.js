import React, { Component } from 'react';
import Header from '../../components/header';
import HomePage from '../../components/sampleList';
import { connectToStore } from '../../lib/utils';
import './style.css';

class Dashboard extends Component {

  componentDidMount() {
    this.props.getAllOutputs();
    console.log(this.props.allPipelineOutputs, 'all outputs');
  }

  
  render() {
    return (
      <div>
        <Header />
        <HomePage />
      </div>
    )
  }
}

export default connectToStore(Dashboard);