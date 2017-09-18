import React, { Component } from 'react';
import Header from '../../components/header';
import HomePage from '../../components/sampleList';
import './style.css';

class Dashboard extends Component {
  render() {
    return (
      <div>
        <Header>
        	Hello world
        </Header>
        <HomePage />
      </div>
    )
  }
}

export default Dashboard;