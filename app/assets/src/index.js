import React from 'react';
import ReactDOM from 'react-dom';
import 'materialize-css';
import 'bootstrap-tooltip';
import 'font-awesome/scss/font-awesome.scss';
import 'materialize-css/dist/css/materialize.css';
import * as Components from'./components/';
import './loader.scss';
const react_component = (componentName, props, target) => {
  const component = Components[componentName];
  if (typeof component !== 'undefined') {
    ReactDOM.render(
    React.createElement(component, props, null),
    document.getElementById(target));
  }
};
window.react_component = react_component;
//
