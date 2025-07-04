import { useContext } from "react";
import eventNames from "~/api/events";
import { GlobalContext } from "~/globalContext/reducer";

type GlobalAnalyticsContextType = {
  projectIds: number | number[] | null;
};

// This is exported from here as well for importing convenience.
export const ANALYTICS_EVENT_NAMES = eventNames;

/**
 * Values we consider reasonable to send as properties of an analytics event.
 *
 * This is a convention we are choosing to make. Our analytics library allows
 * us to send pretty much anything, but we want to ensure a flat structure of
 * key-value pairs for downstream analysis since the structure of the event
 * properties implicitly determines the schema used for the event table when
 * Segment it gets synced to the the data warehouse. If we send an object, or
 * an array, or any other more complex data structure, things can get very
 * messy when the event payload gets translated into DB tables.
 *
 * If you must send more complicated info (for example, an array of IDs),
 * convert it into a string (JSON.stringify, probably) then send the string.
 * The data analysts working with the events can parse the resulting JSON
 * as part of the analysis queries, and this is generally much cleaner than
 * dealing with the strange tables that are automatically generated when
 * working with any kind of nested data structure.
 *
 * We enforce this structure for EventData in the various functions that wrap
 * the calls to our analytics library (eg `logAnalyticsEvent`, etc). Any event
 * we send for analytics should conform to this structure, however it winds
 * up being sent.
 */
type EventValue = string | number | boolean | null | undefined;
export type EventData = Record<string, EventValue>;

// See https://czi.quip.com/bKDnAITc6CbE/How-to-start-instrumenting-analytics-2019-03-06
// See also documentation for withAnalytics below.
const logAnalyticsEvent = async (
  globalAnalyticsContext: GlobalAnalyticsContextType,
  eventName: string,
  eventData: EventData = {},
) => {
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

    if (globalAnalyticsContext) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore-next-line ignore ts error for now while we add types to withAnalytics/trackEvent
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
const withAnalytics = (
  globalAnalyticsContext: GlobalAnalyticsContextType,
  handleEvent: (...args: any[]) => void,
  eventName: string,
  eventData: EventData = {},
) => {
  if (typeof handleEvent !== "function") {
    // eslint-disable-next-line no-console
    console.error(`Missing event handler function "${handleEvent}"`);
  }

  return (...args: any[]) => {
    const ret = handleEvent(...args);
    trackEvent(globalAnalyticsContext, eventName, eventData);
    return ret;
  };
};

export const trackPageTransition = () => {
  window.analytics && window.analytics.page();
};

const trackEvent = (
  globalAnalyticsContext: GlobalAnalyticsContextType,
  eventName: string,
  eventData: EventData = {},
) => {
  logAnalyticsEvent(globalAnalyticsContext, eventName, eventData);
};

/* Hooks for getting helper functions that include globalContext */
const useGlobalAnalyticsContext = () => {
  const globalContext = useContext(GlobalContext);
  return {
    projectIds: globalContext?.globalContextState?.discoveryProjectIds ?? null,
  };
};

export type TrackEventType = (eventName: string, eventData?: EventData) => void;

export const useTrackEvent = (): TrackEventType => {
  const globalAnalyticsContext = useGlobalAnalyticsContext();

  return (eventName: string, eventData?: EventData) =>
    trackEvent(globalAnalyticsContext, eventName, eventData);
};

export type WithAnalyticsType = (
  handleEvent: (...args: any[]) => void,
  eventName: string,
  eventData?: EventData,
) => (...args: any[]) => void | null;

export const useWithAnalytics = (): WithAnalyticsType => {
  const globalAnalyticsContext = useGlobalAnalyticsContext();

  return (
    handleEvent: $TSFixMe,
    eventName: string,
    eventData: EventData = {},
  ) => withAnalytics(globalAnalyticsContext, handleEvent, eventName, eventData);
};

/*
  Helpers for calling trackEvent and withAnalytics from a class component. Adding this ensures
  that we don't forget to remove any trackEvent/withAnalytics imports from other files.
*/
export const trackEventFromClassComponent = (
  globalAnalyticsContext: GlobalAnalyticsContextType,
  eventName: string,
  eventData: EventData = {},
) => {
  trackEvent(globalAnalyticsContext, eventName, eventData);
};

export const withAnalyticsFromClassComponent = (
  globalAnalyticsContext: GlobalAnalyticsContextType,
  handleEvent: (...args: any[]) => void,
  eventName: string,
  eventData: EventData = {},
) => {
  return withAnalytics(
    globalAnalyticsContext,
    handleEvent,
    eventName,
    eventData,
  );
};
