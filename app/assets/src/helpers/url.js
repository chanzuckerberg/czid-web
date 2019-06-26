import QueryString from "query-string";
import {
  filter,
  isObject,
  isArray,
  toPairs,
  pickBy,
  isPlainObject,
  isUndefined,
  flow,
  map,
  flatten,
  join,
} from "lodash/fp";
import { shortenUrl } from "~/api";
import copy from "copy-to-clipboard";

export const resetUrl = () => {
  // remove parameters from url
  window.history.replaceState({}, document.title, location.pathname);
};

// See also parseUrlParams in SamplesHeatmapView
export const parseUrlParams = () => {
  let urlParams = QueryString.parse(location.search, {
    arrayFormat: "bracket",
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
  // Use isPlainObject to remove objects, but keep arrays.
  const filtered = pickBy(
    (v, k) => !isPlainObject(v) && !isUndefined(v),
    params
  );
  return flow(
    toPairs,
    map(
      ([key, value]) =>
        isArray(value)
          ? // Convert array parameters correctly.
            // Filter out objects and nested arrays within the array.
            // We only parse one level deep for now.
            filter(val => !isObject(val), value).map(
              eachValue => `${key}[]=${eachValue}`
            )
          : `${key}=${value}`
    ),
    flatten,
    join("&")
  )(filtered);
};

export const copyShortUrlToClipboard = async url => {
  url = url || window.location.href;
  const shortUrl = await shortenUrl(url);
  copy(window.location.origin + "/" + shortUrl.unique_key);
};
