import eventNames from "~/api/events";
import {
  trackAppcuesPageTransition,
  trackEventForAppcues,
} from "~/components/utils/appcues";
import { getGlobalAnalyticsContext } from "~/redux/modules/discovery/selectors";
import store from "~/redux/store";

// This is exported from here as well for importing convenience.
export const ANALYTICS_EVENT_NAMES = eventNames;

// See https://czi.quip.com/bKDnAITc6CbE/How-to-start-instrumenting-analytics-2019-03-06
// See also documentation for withAnalytics below.
const logAnalyticsEvent = async (eventName: $TSFixMe, eventData = {}) => {
  if (window.analytics) {
    // Include high value user groups in event properties to avoid JOINs downstream.
    // @ts-expect-error ts-migrate(2339) FIXME: Property 'analytics' does not exist on type 'Windo... Remove this comment to see the full error message
    if (window.analytics.user) {
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'analytics' does not exist on type 'Windo... Remove this comment to see the full error message
      const traits = window.analytics.user().traits();
      eventData = {
        // see User.traits_for_analytics
        admin: traits.admin,
        biohub_user: traits.biohub_user,
        czi_user: traits.czi_user,
        has_samples: traits.has_samples,
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'GIT_VERSION' does not exist on type 'Win... Remove this comment to see the full error message
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

    // @ts-expect-error ts-migrate(2339) FIXME: Property 'analytics' does not exist on type 'Windo... Remove this comment to see the full error message
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
export const withAnalytics = (
  handleEvent: $TSFixMe,
  eventName: $TSFixMe,
  eventData = {},
) => {
  if (typeof handleEvent !== "function") {
    // eslint-disable-next-line no-console
    console.error(`Missing event handler function "${handleEvent}"`);
  }

  return (...args: $TSFixMe[]) => {
    const ret = handleEvent(...args);
    trackEvent(eventName, eventData);
    return ret;
  };
};

export const trackPageTransition = () => {
  window.analytics && window.analytics.page();
  trackAppcuesPageTransition();
};

export const trackEvent = (eventName: $TSFixMe, eventData = {}) => {
  logAnalyticsEvent(eventName, eventData);
  trackEventForAppcues(eventName, eventData);
};
