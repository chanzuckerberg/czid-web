import { createSelector } from "@reduxjs/toolkit";

const selectSelf = state => state;

// https://redux-toolkit.js.org/api/createSelector
// Selects the globalAnalytics context from the Redux store
// In the initial Redux implementation, we just want the projectId in our globalContext
export const getGlobalAnalyticsContext = createSelector(selectSelf, state => ({
  projectIds: state.discovery.projectIds,
}));
