// Event name guidelines:
// Follow object_action convention with object being the name of the core model or component name
// if it makes sense, and a past tense action. Keep names meaningful, descriptive, and non-redundant
// (e.g. prefer sample_viewed to sample_view_viewed).
// ANALYTICS_EVENT_NAMES will have the camelCase key and snake_case value.
// TODO: (gdingle): coordinate with ANALYTICS_EVENT_NAMES in server ruby

export const ANALYTICS_EVENT_NAMES = {
  sampleViewed: "sample_viewed",
  userInterestFormSubmitted: "user_interest_form_submitted"
};
