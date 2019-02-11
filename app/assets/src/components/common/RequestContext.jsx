import React from "react";

export const RequestContext = React.createContext({
  enabledFeatures: new Set()
});
