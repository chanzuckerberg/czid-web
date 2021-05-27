import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { StylesProvider, ThemeProvider } from "@material-ui/core/styles";
import * as Sentry from "@sentry/react";
import { defaultTheme } from "czifui";
import React from "react";
import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import { UserContext } from "~/components/common/UserContext";
import store from "~/redux/store";
import "url-search-params-polyfill";
import "font-awesome/scss/font-awesome.scss";
import "semantic-ui-css/semantic.min.css";
import "./loader.scss";
import "./styles/core.scss";
import "./styles/appcues.scss";

// Sentry Basic Configuration Options: https://docs.sentry.io/platforms/javascript/guides/react/config/basics/
Sentry.init({
  dsn: window.SENTRY_DSN_FRONTEND,
  environment: window.ENVIRONMENT,
  release: window.GIT_RELEASE_SHA,
});

if (!function f() {}.name) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Function.prototype, "name", {
    get: function() {
      var name = (this.toString().match(/^function\s*([^\s(]+)/) || [])[1];
      Object.defineProperty(this, "name", { value: name });
      return name;
    },
  });
}

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
});

// Turn off camelcase rule
/* eslint camelcase: 0 */
const react_component = (componentName, props, target, userContext) => {
  const matchedComponent = foundComponents[componentName];
  if (matchedComponent) {
    ReactDOM.render(
      <Sentry.ErrorBoundary fallback={"An error has occured"}>
        <UserContext.Provider value={userContext || {}}>
          <Provider store={store}>
            <StylesProvider injectFirst>
              <EmotionThemeProvider theme={defaultTheme}>
                <ThemeProvider theme={defaultTheme}>
                  {React.createElement(matchedComponent, props)}
                </ThemeProvider>
              </EmotionThemeProvider>
            </StylesProvider>
          </Provider>
        </UserContext.Provider>
      </Sentry.ErrorBoundary>,
      document.getElementById(target)
    );
    if (userContext && userContext.userId) {
      Sentry.setUser({ id: userContext.userId });
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(
      "Couldn't find component for",
      componentName,
      foundComponents
    );
  }
};

window.react_component = react_component;
