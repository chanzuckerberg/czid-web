import React from 'react';
import ReactDOM from 'react-dom';
import 'materialize-css';
import 'materialize-css/dist/css/materialize.css';
import * as Components from'./components/';
import './loader.scss';
const react_component = (componentName, props) => {
  console.log('All', Components);
  console.log('Component found', Components[componentName] );
  const component = Components[componentName];
  if (typeof component === 'undefined') {
    console.log('That component is not defined', component);
  }
  ReactDOM.render(
  React.createElement(component, props, null),
  document.getElementById('hello'));
};
window.react_component = react_component;
