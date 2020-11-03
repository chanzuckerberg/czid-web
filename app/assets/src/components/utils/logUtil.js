import * as Sentry from "@sentry/browser";

// For more information on Sentry usage see: https://docs.sentry.io/platforms/javascript/usage/
export const logError = ({ message, exception = null, details = {} }) => {
  if (exception) {
    Sentry.captureException(exception, {
      extra: {
        message,
        details,
      },
    });
  } else {
    Sentry.captureMessage(message, {
      extra: details,
    });
  }
};
