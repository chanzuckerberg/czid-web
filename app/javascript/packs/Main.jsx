import React, {Component} from 'react';
import Header from '../components/Header';
import Login from '../components/Login';
import Home from '../container/Home';
import SampleUpload from '../components/SampleUpload';
import PipelineSampleReads from '../components/PipelineSampleReads';
import { BrowserRouter, Route } from 'react-router-dom'

export default class Main extends Component  {
  render() {
    return (
      <div>
      <Header />
       <div>
          <Route exact path="/home" component={Home}/>
          <Route path="/upload" component={SampleUpload} />
          <Route path="/login" component={Login}/>
          <Route path="/home/:id" component={PipelineSampleReads} />
       </div>
      </div>
    )
  } 
}

