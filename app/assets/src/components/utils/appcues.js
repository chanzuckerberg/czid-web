import { withAnalytics } from "~/api/analytics";

export const showAppcue = ({
  flowId,
  analyticEventName,
  analyticEventProperties = {},
}) =>
  withAnalytics(
    () => window.Appcues && window.Appcues.show(flowId),
    analyticEventName,
    analyticEventProperties,
  );

export const trackEventForAppcues = (eventName, eventData = {}) => {
  // Appcues only takes attributes as a flat object (not nested)
  const deconstructedEvent = {
    ...window?.USER_TRAITS_WITHOUT_PII,
    ...eventData,
  };
  window.Appcues && window.Appcues.track(eventName, deconstructedEvent);
};

export const trackAppcuesPageTransition = () => {
  window.Appcues && window.Appcues.page();
};

// Appcues Flows - Follow naming convention: Component/Appcue Flow
const SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR =
  "7ea80598-2fd9-4b16-bd16-bca84e1de7e2";
const SAMPLES_HEATMAP_HEADER_HELP_SIDEBAR =
  "a12e114a-244b-464f-9049-01baf29edd2a";
const SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR =
  "22bef9e6-ac39-4a95-abb4-422e1324f2c4";
const PHYLO_TREE_LIST_VIEW_HELP_SIDEBAR =
  "47cf7528-ceb9-4583-9083-9685c50c6313";
const PHYLO_TREE_LIST_VIEW_MATRIX_HELP_SIDEBAR =
  "2d6fc48f-39a7-494f-830f-43e15a348d9d";

export {
  SAMPLES_HEATMAP_HEADER_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR,
  PHYLO_TREE_LIST_VIEW_HELP_SIDEBAR,
  PHYLO_TREE_LIST_VIEW_MATRIX_HELP_SIDEBAR,
};
