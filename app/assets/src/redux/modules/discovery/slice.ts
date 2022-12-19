import { createSlice } from "@reduxjs/toolkit";

/*
  https://redux-toolkit.js.org/api/createSlice#createslice
  A Redux slice removes the need for traditional Redux boilerplate code (actions, action creators, reducers, initial state)
  and is a collection of reducer logic and actions for a single feature of an app. The name “slice” comes from the
  idea that we’re splitting up the root Redux state object into multiple “slices” of slate. By using "slices" we
  increase the separation of concerns in our app
*/

const initialState = { projectIds: null };

// The discoverySlice is responsible for state in the discovery feature of our app
// For this initial implementation, we just store the projectId
const discoverySlice = createSlice({
  name: "discovery",
  initialState,
  reducers: {
    updateProjectIds(state, action) {
      state.projectIds = action.payload;
    },
  },
});

export const { updateProjectIds } = discoverySlice.actions;

export default discoverySlice.reducer;
