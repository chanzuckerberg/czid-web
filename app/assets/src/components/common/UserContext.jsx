import React from "react";

export const UserContext = React.createContext({
  allowedFeatures: new Set(),
});
