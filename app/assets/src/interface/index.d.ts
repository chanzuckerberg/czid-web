export {};

declare global {
  interface Window {
    analytics: { page: () => void };
    SENTRY_DSN_FRONTEND;
    ENVIRONMENT;
    GIT_RELEASE_SHA;
    react_component;
  }

  // TODO: Remove this after upgrading to TS v5.
  interface Array<T> {
    findLastIndex(
      predicate: (value: T, index: number, obj: T[]) => unknown,
      thisArg?: any,
    ): number;
  }
}
