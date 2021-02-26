import { isArray, isObject, camelCase, snakeCase, lowerFirst } from "lodash/fp";

import eventNames from "~/api/events";
import store from "~/redux/store";
import { getGlobalAnalyticsContext } from "~/redux/modules/discovery/selectors";

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
 * For wrapping event handlers in React. The first part of the name should be
 * the React component. The middle part should be user-friendly UI name. The
 * last part should be the action taken.
 *
 * <ReactComponent>_<friendly-name-of-ui-element>_<past_tense_action>
 *
 * In this way, we can easily discern the
 * context and meaning of an analytics event in a report and locate it in the
 * codebase.
 *
 * The eventData should be used for extra data that would be useful for an
 * analysis specific to the event. The keys in should be named the same as in
 * the calling context for easy interpretation. Only scalars should be passed to
 * keep things simple downstream. Arrays should be replaced by their lengths.
 *
 * For example:
 *
 *    withAnalytics(
 *      this.renderMoreReads,
 *      "AccessionViz_more-reads-link_clicked",
 *      { projectId: this.state.projectId, reads: this.state.reads.length }
 *    )
 *
 * React events should have have a single callsite, so there is no need to put
 * them in ANALYTICS_EVENT_NAMES.
 *
 **/
export const withAnalytics = (handleEvent, eventName, eventData = {}) => {
  if (typeof handleEvent !== "function") {
    // eslint-disable-next-line no-console
    console.error(`Missing event handler function "${handleEvent}"`);
  }

  const [componentName, friendlyName, ...actionType] = eventName.split("_");

  if (!(componentName && friendlyName && actionType.length)) {
    // eslint-disable-next-line no-console
    console.warn(`Missing one part of analytics event name in "${eventName}"`);
  }
  if (camelCase(componentName) !== lowerFirst(componentName)) {
    // eslint-disable-next-line no-console
    console.warn(
      `Component name "${componentName}" should be CamelCase in "${eventName}"`
    );
  }
  if (snakeCase(friendlyName).replace(/_/g, "-") !== friendlyName) {
    // eslint-disable-next-line no-console
    console.warn(
      `Friendly name "${friendlyName}" should be dash-case in "${eventName}"`
    );
  }
  if (actionType.length > 1) {
    // eslint-disable-next-line no-console
    console.warn(
      `Action type "${actionType}" should be single word in "${eventName}"`
    );
  }

  for (var k in eventData) {
    const val = eventData[k];
    if (isArray(val) || isObject(val)) {
      // eslint-disable-next-line no-console
      console.warn(`${val} should be a scalar in "${eventName}"`);
    }
  }

  return (...args) => {
    const ret = handleEvent(...args);
    logAnalyticsEvent(eventName, eventData);
    return ret;
  };
};
