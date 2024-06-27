import { defaultTheme } from "@czi-sds/components";
import { ThemeProvider as EmotionThemeProvider } from "@emotion/react";
import { StyledEngineProvider, ThemeProvider } from "@mui/material/styles";
import * as Sentry from "@sentry/react";
import "font-awesome/scss/font-awesome.scss";
import React, { ComponentClass, FunctionComponent, useReducer } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "semantic-ui-css/semantic.min.css";
import "url-search-params-polyfill";
import { UserContext } from "~/components/common/UserContext";
import { SHOULD_READ_FROM_NEXTGEN } from "./components/utils/features";
import { initialGlobalContextState } from "./globalContext/initialState";
import { GlobalContext, globalContextReducer } from "./globalContext/reducer";
import UserContextType from "./interface/allowedFeatures";
import "./loader.scss";
import RelayEnvironment from "./relay/RelayEnvironment";
import "./styles/appcues.scss";
import "./styles/core.scss";

// Sentry Basic Configuration Options: https://docs.sentry.io/platforms/javascript/guides/react/config/basics/
Sentry.init({
  dsn: window.SENTRY_DSN_FRONTEND,
  environment: window.ENVIRONMENT,
  release: window.GIT_RELEASE_SHA,
});

// eslint-disable-next-line @typescript-eslint/no-empty-function
if (!function f() {}.name) {
  // eslint-disable-next-line no-extend-native
  Object.defineProperty(Function.prototype, "name", {
    get: function () {
      const name = (this.toString().match(/^function\s*([^\s(]+)/) || [])[1];
      Object.defineProperty(this, "name", { value: name });
      return name;
    },
  });
}

const context = require.context("./components", true, /\.(js|jsx|ts|tsx)$/);
const foundComponents = {};
const contextKeys = context.keys();
contextKeys.forEach(key => {
  let a = null;
  if (typeof context(key) === "function") {
    a = context(key);
  } else if (typeof context(key) === "object") {
    a = context(key).default;
  }
  // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
  if (a && a.name) {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2339
    foundComponents[a.name] = a;
  }
});

// Using a function component provides a way to access useReducer
const ReactComponentWithGlobalContext = ({
  matchedComponent,
  props,
  userContext,
}: {
  matchedComponent: string | FunctionComponent<any> | ComponentClass<any, any>;
  props: any;
  userContext: UserContextType;
}) => {
  const [globalContextState, globalContextDispatch] = useReducer(
    globalContextReducer,
    initialGlobalContextState,
  );
  const shouldReadFromNextGen = userContext?.allowedFeatures?.includes(
    SHOULD_READ_FROM_NEXTGEN,
  );
  return (
    <Sentry.ErrorBoundary fallback={"An error has occured"}>
      <BrowserRouter>
        <RelayEnvironment shouldReadFromNextGen={shouldReadFromNextGen}>
          <UserContext.Provider value={userContext}>
            <GlobalContext.Provider
              value={{ globalContextState, globalContextDispatch }}
            >
              <StyledEngineProvider injectFirst>
                <EmotionThemeProvider theme={defaultTheme}>
                  <ThemeProvider theme={defaultTheme}>
                    {React.createElement(matchedComponent, props)}
                  </ThemeProvider>
                </EmotionThemeProvider>
              </StyledEngineProvider>
            </GlobalContext.Provider>
          </UserContext.Provider>
        </RelayEnvironment>
      </BrowserRouter>
    </Sentry.ErrorBoundary>
  );
};

// Turn off camelcase rule
/* eslint camelcase: 0 */
const react_component = (
  componentName: string,
  props: object,
  target: string,
  userContext,
) => {
  const matchedComponent = foundComponents[componentName];
  if (matchedComponent) {
    // @ts-expect-error CZID-8698 expect strictNullCheck error: error TS2345
    const root = createRoot(document.getElementById(target));
    root.render(
      <ReactComponentWithGlobalContext
        matchedComponent={matchedComponent}
        props={props}
        userContext={userContext}
      />,
    );
    if (userContext && userContext.userId) {
      Sentry.setUser({ id: userContext.userId });
    }
  } else {
    // eslint-disable-next-line no-console
    console.error(
      "Couldn't find component for",
      componentName,
      foundComponents,
    );
  }
};

window.react_component = react_component;
