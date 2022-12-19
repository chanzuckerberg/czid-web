export {};

declare global {
  interface Window {
    analytics: { page: () => void };
    SENTRY_DSN_FRONTEND;
    ENVIRONMENT;
    GIT_RELEASE_SHA;
    react_component;
  }
}
