import { getURLParamString } from "~/helpers/url";
import { openUrlInPopupWindow } from "~/components/utils/links";

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
    BASESPACE_OAUTH_WINDOW_HEIGHT
  );
};
