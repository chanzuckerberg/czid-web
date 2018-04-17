import React from 'react';
import ReactDOM from 'react-dom';
import 'materialize-css';
import 'materialize-css/dist/css/materialize.css';
import 'nouislider/distribute/nouislider.css';
import 'react-tipsy/dist/react-tipsy.css';
import 'font-awesome/scss/font-awesome.scss';
import 'semantic-ui-css/semantic.min.css';
import './loader.scss';
import './styles/materialize-override.scss';

const context = require.context('./components', true, /\.(js|jsx)$/);
const foundComponents = {};
const contextKeys = context.keys();
contextKeys.forEach((key) => {
  let a = null;
  if (typeof context(key) === 'function') {
    a = context(key);
  } else if (typeof context(key) === 'object') {
    a = context(key).default;
  }
  if (a && a.name) {
    foundComponents[a.name] = a;
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
  } else {
    console.log("Couldn't find component for", componentName, foundComponents);
  }
};

window.react_component = react_component;
