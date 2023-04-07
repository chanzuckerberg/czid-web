import copy from "copy-to-clipboard";
import {
  filter,
  flatten,
  flow,
  isArray,
  isObject,
  isPlainObject,
  isUndefined,
  join,
  map,
  pickBy,
  toPairs,
} from "lodash/fp";
import QueryString from "query-string";
import { shortenUrl } from "~/api";

// See also parseUrlParams in SamplesHeatmapView
export const parseUrlParams = (): QueryString.ParsedQuery<
  string | boolean | number
> => {
  const urlParams = QueryString.parse(location.search, {
    arrayFormat: "bracket",
  });
  for (const key in urlParams) {
    // Don't parse pipeline_version even though it looks like a number.
    // 3.10 is different from 3.1
    // TODO(mark): Switch to using UrlQueryParser instead.
    if (key !== "pipeline_version") {
      try {
        // This parses booleans and numbers.
        // @ts-expect-error Type 'string[]' is not assignable to type 'string'
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
  const filtered = pickBy(v => !isPlainObject(v) && !isUndefined(v), params);
  return flow(
    toPairs,
    map(
      // Convert array parameters correctly.
      // Filter out objects and nested arrays within the array.
      // We only parse one level deep for now.
      ([key, value]) =>
        isArray(value)
          ? filter(val => !isObject(val), value).map(
              eachValue => `${key}[]=${eachValue}`,
            )
          : `${key}=${value}`,
    ),
    flatten,
    join("&"),
  )(filtered);
};

export const copyShortUrlToClipboard = async (url?: string) => {
  const shortUrl = await shortenUrl(url || window.location.href);
  copy(window.location.origin + "/" + shortUrl.unique_key);
};

export const copyUrlToClipboard = async (url?: string) => {
  url = url || window.location.href;
  copy(url);
};
