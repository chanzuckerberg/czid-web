import { configureStore } from "@reduxjs/toolkit";
import rootReducer from "./rootReducer";

// configureStore: https://redux-toolkit.js.org/api/configureStore#configurestore
export default configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== "production",
});
