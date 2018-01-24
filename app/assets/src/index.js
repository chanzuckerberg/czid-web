import React from 'react';
import ReactDOM from 'react-dom';
import 'materialize-css';
import 'materialize-css/dist/css/materialize.css';
import 'react-tipsy/dist/react-tipsy.css';
import 'font-awesome/scss/font-awesome.scss';
import StringHelper from './helpers/StringHelper';
import './loader.scss';

// autoload components for react_component method
const context = require.context('./components', true, /\.(js|jsx)$/);
const foundComponents = {};
const contextKeys = context.keys();
contextKeys.forEach((key) => {
  let a = null;
  const methodName = StringHelper.baseName(key);
  if (typeof context(key) === 'function') {
    a = context(key);
  } else if (typeof context(key) === 'object') {
    a = context(key).default;
  }
  if (a && methodName) {
    // map the correct component name
    foundComponents[methodName] = a;
  }
});
/* eslint camelcase: 0 */ // Turn off camelcase rule
const react_component = (componentName, props, target) => {
  const matchedComponent = foundComponents[componentName];
  if (matchedComponent) {
    ReactDOM.render(
      React.createElement(matchedComponent, props, null),
      document.getElementById(target)
    );
  }
};

window.react_component = react_component;
