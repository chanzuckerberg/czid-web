import { WithAnalyticsType } from "~/api/analytics";

declare global {
  interface Window {
    Appcues?: {
      show: (flowId: string) => void;
      track: (
        eventname: string,
        deconstructedEvent: Record<string, unknown>,
      ) => void;
      page: () => void;
    };
    USER_TRAITS_WITHOUT_PII: Record<string, unknown>;
  }
}

export const showAppcue = ({
  flowId,
  withAnalytics,
  analyticEventName,
  analyticEventProperties = {},
}: {
  flowId: string;
  withAnalytics: WithAnalyticsType;
  analyticEventName: string;
  analyticEventProperties?: Record<string, string>;
}) => {
  return withAnalytics(
    () => window.Appcues && window.Appcues.show(flowId),
    analyticEventName,
    analyticEventProperties,
  );
};

export const trackEventForAppcues = (eventName: string, eventData = {}) => {
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
const SAMPLE_VIEW_HEADER_AMR_HELP_SIDEBAR =
  "a8f5cd0f-236a-4e7a-8650-e17d43ebab3d";
const PHYLO_TREE_LIST_VIEW_HELP_SIDEBAR =
  "47cf7528-ceb9-4583-9083-9685c50c6313";
const PHYLO_TREE_LIST_VIEW_MATRIX_HELP_SIDEBAR =
  "2d6fc48f-39a7-494f-830f-43e15a348d9d";

export {
  SAMPLES_HEATMAP_HEADER_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_MNGS_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_CG_HELP_SIDEBAR,
  SAMPLE_VIEW_HEADER_AMR_HELP_SIDEBAR,
  PHYLO_TREE_LIST_VIEW_HELP_SIDEBAR,
  PHYLO_TREE_LIST_VIEW_MATRIX_HELP_SIDEBAR,
};
