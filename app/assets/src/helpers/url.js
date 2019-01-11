import QueryString from "query-string";

export const resetUrl = () => {
  // remove parameters from url
  window.history.replaceState({}, document.title, location.pathname);
};

export const parseUrlParams = () => {
  let urlParams = QueryString.parse(location.search, {
    arrayFormat: "bracket"
  });
  return urlParams;
};
