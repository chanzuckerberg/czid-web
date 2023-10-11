import React, { useContext } from "react";
import UserContextType from "~/interface/allowedFeatures";

const UserContextValues: UserContextType = {
  admin: false,
  firstSignIn: false,
  allowedFeatures: [],
  appConfig: {},
  userSettings: {},
  userSignedIn: false,
  userId: null,
  userName: null,
  userEmail: null,
  profileCompleted: false,
};

export const UserContext = React.createContext(UserContextValues);
// Name to show in DevTools
UserContext.displayName = "UserContext";

// hook for retrieving allowedFeatures from UserContext
export const useAllowedFeatures = () => {
  const { allowedFeatures } = useContext(UserContext);
  return allowedFeatures;
};
