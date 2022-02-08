import { sortBy } from "lodash/fp";

import { openUrlInPopupWindow } from "~/components/utils/links";
import { getURLParamString } from "~/helpers/url";

const BASESPACE_OAUTH_URL = "https://basespace.illumina.com/oauth/authorize";
const BASESPACE_OAUTH_WINDOW_NAME = "BASESPACE_OAUTH_WINDOW";
const BASESPACE_OAUTH_WINDOW_WIDTH = 1000;
const BASESPACE_OAUTH_WINDOW_HEIGHT = 600;

export const openBasespaceOAuthPopup = params => {
  const urlParams = getURLParamString({
    ...params,
    response_type: "code",
  });

  return openUrlInPopupWindow(
    `${BASESPACE_OAUTH_URL}?${urlParams}`,
    BASESPACE_OAUTH_WINDOW_NAME,
    BASESPACE_OAUTH_WINDOW_WIDTH,
    BASESPACE_OAUTH_WINDOW_HEIGHT,
  );
};

// The following three functions were extracted from SampleTypeSearchBox.
// They aid client-side search of options.
export const doesResultMatch = (result, query) => {
  // If no query, return all possible
  if (query === "") return true;

  // Match chars in any position. Good for acronyms. Ignore spaces.
  const noSpaces = query.replace(/\s*/gi, "");
  const regex = new RegExp(noSpaces.split("").join(".*"), "gi");
  if (regex.test(result.name)) {
    return true;
  }
  return false;
};

// Sort matches by position of match. If no position, by func.
export const sortResults = (matchedResults, query, func) => {
  let sortedResults = sortBy(func, matchedResults);
  if (query !== "") {
    sortedResults = sortBy(
      result => sortResultsByMatch(result, query),
      sortedResults,
    );
  }
  return sortedResults;
};

export const sortResultsByMatch = (result, query) => {
  const name = result.name.toLowerCase();
  const q = query.toLowerCase();
  const res =
    name.indexOf(q) === -1 ? Number.MAX_SAFE_INTEGER : name.indexOf(q);
  return res;
};
