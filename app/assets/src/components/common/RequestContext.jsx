import React from "react";

export const RequestContext = React.createContext({
  allowedFeatures: new Set(),
});
