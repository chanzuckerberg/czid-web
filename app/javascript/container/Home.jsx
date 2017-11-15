import React, { Component } from 'react';
import Samples from '../components/samples';
import axios from 'axios';
// import './style.css';

export default class Home extends Component {
  constructor(props, context) {
    super(props, context);
    this.state = {
      allSamples: null
    }
  }

  fetchSamplesInfo() {
    console.log('fetching info')
    axios.get('http://localhost:3000/home.json')
    .then((response) => {
      console.log('done fetching info')
      let samplesInfo = response.data
      this.setState({ allSamples: samplesInfo})
    }).catch((error) => {
      console.log(error.response, 'error')
      this.setState({
        allSamples: null
      })
    })
  }

  componentDidMount() {
    this.fetchSamplesInfo()
  }

  render() {
    console.log(this.state, this.state.allSamples)
    return (
      <div>
          { this.state.allSamples ? <Samples  {...this.state.allSamples}/> : <h5 className="center">Loading...</h5>} 
      </div>
    )
  }
}

// export default Home;