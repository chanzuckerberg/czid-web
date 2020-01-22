import React from "react";

export const UserContext = React.createContext({
  admin: false,
  allowedFeatures: new Set(),
  appConfig: {},
  userSettings: {},
});
// Name to show in DevTools
UserContext.displayName = "UserContext";
