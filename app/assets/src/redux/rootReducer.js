import { combineReducers } from "@reduxjs/toolkit";
import discoveryReducer from "./modules/discovery/slice";

// https://redux.js.org/recipes/structuring-reducers/using-combinereducers#using-combinereducers
// combineReducers takes an object full of slice reducer functions, and creates a function that outputs a corresponding state object with the same keys.
export default combineReducers({
  discovery: discoveryReducer,
});
