import QueryString from "query-string";
import UrlQueryParser from "~/components/utils/UrlQueryParser";
import { URL_FIELDS } from "~/components/views/SampleView/constants";
import {
  filter,
  isEmpty,
  isObject,
  isArray,
  toPairs,
  pickBy,
  isPlainObject,
  isUndefined,
  flow,
  map,
  omit,
  flatten,
  join,
} from "lodash/fp";
import { shortenUrl } from "~/api";
import copy from "copy-to-clipboard";

const urlParser = new UrlQueryParser(URL_FIELDS);

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

export const copyShortUrlToClipboard = async ({
  url = "",
  removeGlobalContext = false,
} = {}) => {
  url = url === "" ? window.location.href : url;
  url = removeGlobalContext ? removeURLParameter(url, "globalContext") : url;

  const shortUrl = await shortenUrl(url);
  copy(window.location.origin + "/" + shortUrl.unique_key);
};

export const copyUrlToClipboard = async url => {
  url = url || window.location.href;
  copy(url);
};

const removeURLParameter = (url, parameter) => {
  const urlParts = url.split("?");
  const urlQueryParams = urlParser.parse(urlParts[1]);
  const allowedParams = urlParser.stringify(omit(parameter, urlQueryParams));

  // If allowedParams is empty, then there's no query string - so return everything before the query parameters.
  // Else, return the new URL with the specified parameter omitted.
  return isEmpty(allowedParams)
    ? urlParts[0]
    : urlParts[0] + "?" + allowedParams;
};
