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
