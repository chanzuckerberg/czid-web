import { isArray, isObject, camelCase, snakeCase, lowerFirst } from "lodash/fp";

// Event name guidelines: Follow object_action convention with object being the
// name of the core model if it makes sense, and a past tense action. Keep names
// meaningful, descriptive, and non-redundant (e.g. prefer sample_viewed to
// sample_view_viewed). ANALYTICS_EVENT_NAMES will have the camelCase key and
// snake_case value. See
// https://czi.quip.com/bKDnAITc6CbE/How-to-start-instrumenting-analytics-2019-03-06
//
// Dom events handled in React components should use withAnalytics instead of
// ANALYTICS_EVENT_NAMES, which does not require registration here and uses a
// more elaborate naming convention.
export const ANALYTICS_EVENT_NAMES = {
  sampleViewed: "sample_viewed",
  userInterestFormSubmitted: "user_interest_form_submitted"
};

// See https://czi.quip.com/bKDnAITc6CbE/How-to-start-instrumenting-analytics-2019-03-06
// See also documentation for withAnalytics below.
export const logAnalyticsEvent = (eventName, eventData = {}) => {
  if (window.analytics) {
    // Include high value user groups in event properties to avoid JOINs downstream.
    if (window.analytics.user) {
      const traits = window.analytics.user().traits();
      eventData = {
        // see traits_for_segment
        admin: traits.admin,
        biohub_user: traits.biohub_user,
        czi_user: traits.biohub_user,
        demo_user: traits.demo_user,
        has_samples: traits.has_samples,
        git_version: window.GIT_VERSION,
        // label and category are for Google Analytics. See
        // https://segment.com/docs/destinations/google-analytics/#track
        label: JSON.stringify(eventData),
        category: eventName.split("_")[0],
        // caller can override above traits if they know what they are doing
        ...eventData
      };
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
  const [componentName, friendlyName, ...actionType] = eventName.split("_");

  if (!(componentName && friendlyName && actionType.length)) {
    // eslint-disable-next-line no-console
    console.warn(`Missing one part of analytics event name in "${eventName}"`);
  }
  if (camelCase(componentName) != lowerFirst(componentName)) {
    // eslint-disable-next-line no-console
    console.warn(
      `Component name "${componentName}" should be CamelCase in "${eventName}"`
    );
  }
  if (snakeCase(friendlyName).replace(/_/g, "-") != friendlyName) {
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
      console.warn(`${val} should be a scalar value`);
    }
  }

  return (...args) => {
    const ret = handleEvent(...args);
    logAnalyticsEvent(eventName, eventData);
    return ret;
  };
};
