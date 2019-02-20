import QueryString from "query-string";
import { toPairs, pickBy } from "lodash/fp";

export const resetUrl = () => {
  // remove parameters from url
  window.history.replaceState({}, document.title, location.pathname);
};

// See also parseUrlParams in SamplesHeatmapView
export const parseUrlParams = () => {
  let urlParams = QueryString.parse(location.search, {
    arrayFormat: "bracket"
  });
  for (var key in urlParams) {
    try {
      urlParams[key] = JSON.parse(urlParams[key]);
    } catch (e) {
      // pass
    }
  }
  return urlParams;
};

export const getURLParamString = params => {
  const filtered = pickBy((v, k) => typeof v !== "object", params);
  return toPairs(filtered)
    .map(pair => pair.join("="))
    .join("&");
};
