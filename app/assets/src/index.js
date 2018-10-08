import React from "react";
import ReactDOM from "react-dom";
import "url-search-params-polyfill";
import "materialize-css";
import "materialize-css/dist/css/materialize.css";
import "nouislider/distribute/nouislider.css";
import "react-tipsy/dist/react-tipsy.css";
import "font-awesome/scss/font-awesome.scss";
import "semantic-ui-css/semantic.min.css";
import "./loader.scss";

const context = require.context("./components", true, /\.(js|jsx)$/);
const foundComponents = {};
const contextKeys = context.keys();
contextKeys.forEach(key => {
  let a = null;
  if (typeof context(key) === "function") {
    a = context(key);
  } else if (typeof context(key) === "object") {
    a = context(key).default;
  }
  if (a && a.name) {
    foundComponents[a.name] = a;
  }
}); // Turn off camelcase rule
/* eslint camelcase: 0 */ const react_component = (
  componentName,
  props,
  target
) => {
  const matchedComponent = foundComponents[componentName];
  if (matchedComponent) {
    ReactDOM.render(
      React.createElement(matchedComponent, props, null),
      document.getElementById(target)
    );
  } else {
    // TODO: do proper error processing
    // eslint-disable-next-line no-console
    console.error(
      "Couldn't find component for",
      componentName,
      foundComponents
    );
  }
};

window.react_component = react_component;
