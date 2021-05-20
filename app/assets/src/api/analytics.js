import eventNames from "~/api/events";
import { getGlobalAnalyticsContext } from "~/redux/modules/discovery/selectors";
import store from "~/redux/store";

// This is exported from here as well for importing convenience.
export const ANALYTICS_EVENT_NAMES = eventNames;

// See https://czi.quip.com/bKDnAITc6CbE/How-to-start-instrumenting-analytics-2019-03-06
// See also documentation for withAnalytics below.
export const logAnalyticsEvent = async (eventName, eventData = {}) => {
  if (window.analytics) {
    // Include high value user groups in event properties to avoid JOINs downstream.
    if (window.analytics.user) {
      const traits = window.analytics.user().traits();
      eventData = {
        // see traits_for_segment
        admin: traits.admin,
        biohub_user: traits.biohub_user,
        czi_user: traits.czi_user,
        has_samples: traits.has_samples,
        git_version: window.GIT_VERSION,
        // label and category are for Google Analytics. See
        // https://segment.com/docs/destinations/google-analytics/#track
        label: JSON.stringify(eventData),
        category: eventName.split("_")[0],
        // caller can override above traits if they know what they are doing
        ...eventData,
      };
    }

    // Get the global analytic context from the Redux global state tree using the getGlobalAnalyticsContext selector
    const globalAnalyticsContext = getGlobalAnalyticsContext(store.getState());

    if (globalAnalyticsContext) {
      eventData["globalContext"] = globalAnalyticsContext;
    }

    window.analytics.track(eventName, eventData);
  }
};

/**
 * For wrapping event handlers in React. Event should be taken from ANALYTICS_EVENT_NAMES.
 *
 * For example:
 *
 *    withAnalytics(
 *      this.onClose,
 *      ANALYTICS_EVENT_NAMES.MODAL_CLOSED,
 *      { projectId: this.state.projectId, sampleId: this.state.sampleId }
 *    )
 *
 **/
export const withAnalytics = (handleEvent, eventName, eventData = {}) => {
  if (typeof handleEvent !== "function") {
    // eslint-disable-next-line no-console
    console.error(`Missing event handler function "${handleEvent}"`);
  }

  return (...args) => {
    const ret = handleEvent(...args);
    logAnalyticsEvent(eventName, eventData);
    return ret;
  };
};
