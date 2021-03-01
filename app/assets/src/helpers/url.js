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

// See also parseUrlParams in SamplesHeatmapView
export const parseUrlParams = () => {
  let urlParams = QueryString.parse(location.search, {
    arrayFormat: "bracket",
  });
  for (var key in urlParams) {
    // Don't parse pipeline_version even though it looks like a number.
    // 3.10 is different from 3.1
    // TODO(mark): Switch to using UrlQueryParser instead.
    if (key !== "pipeline_version") {
      try {
        // This parses booleans and numbers.
        urlParams[key] = JSON.parse(urlParams[key]);
      } catch (e) {
        // pass
      }
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
      // Convert array parameters correctly.
      // Filter out objects and nested arrays within the array.
      // We only parse one level deep for now.
      ([key, value]) =>
        isArray(value)
          ? filter(val => !isObject(val), value).map(
              eachValue => `${key}[]=${eachValue}`
            )
          : `${key}=${value}`
    ),
    flatten,
    join("&")
  )(filtered);
};

export const copyShortUrlToClipboard = async url => {
  const shortUrl = await shortenUrl(url || window.location.href);
  copy(window.location.origin + "/" + shortUrl.unique_key);
};

export const copyUrlToClipboard = async url => {
  url = url || window.location.href;
  copy(url);
};
