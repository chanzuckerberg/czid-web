import React, {Component} from 'react';
import Header from '../components/Header';
import Login from '../components/Login';
import Home from '../container/Home';
import { Switch, Route } from 'react-router-dom'

export default class Main extends Component  {
  render() {
    return (
      <div>
      <Header />
       <div>
          <Route exact path="/home" component={Home}/>
          <Route exact path="/login" component={Login}/>
       </div>
      </div>
    )
  } 
}

