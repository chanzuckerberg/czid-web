import axios from "axios";

const INSTRUMENTATION_ENDPOINT = "/frontend_metrics";
const MAX_SAMPLES_FOR_GET_REQUEST = 256;
const DEVELOPMENT_MODE = process.env.NODE_ENV === "development";

const postToFrontendMetrics = async (
  url: $TSFixMe,
  resp: $TSFixMe,
  duration: $TSFixMe,
) =>
  axios
    .post(INSTRUMENTATION_ENDPOINT, {
      url: url,
      response_time: duration,
      http_method: resp.config.method,
      http_status: resp.status,
    })
    .catch(e => Promise.reject(new Error(e?.response?.data)));

const instrument = (func: $TSFixMe) => {
  return async (url: $TSFixMe, ...args: $TSFixMe[]) => {
    const startTime = performance.now();
    try {
      return await func
        .apply(this, [url, ...args])
        .then(async (resp: $TSFixMe) => {
          !DEVELOPMENT_MODE &&
            postToFrontendMetrics(url, resp, performance.now() - startTime);
          return resp.data;
        });
    } catch (errorResp) {
      !DEVELOPMENT_MODE &&
        postToFrontendMetrics(url, errorResp, performance.now() - startTime);
      return Promise.reject(errorResp);
    }
  };
};

const CSRF_TOKEN = "csrf-token";

const postWithCSRF = instrument(async (url: $TSFixMe, params: $TSFixMe) => {
  try {
    // resp also contains headers, status, etc. that we might use later.
    return await axios.post(url, {
      ...params,
      // Fetch the CSRF token from the DOM.
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'content' does not exist on type 'HTMLEle... Remove this comment to see the full error message
      authenticity_token: document.getElementsByName(CSRF_TOKEN)[0].content,
    });
  } catch (e) {
    return Promise.reject(e.response);
  }
});

// TODO(mark): Remove redundancy in CSRF methods.
const putWithCSRF = instrument(async (url: $TSFixMe, params: $TSFixMe) => {
  try {
    // resp also contains headers, status, etc. that we might use later.
    return await axios.put(url, {
      ...params,
      // Fetch the CSRF token from the DOM.
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'content' does not exist on type 'HTMLEle... Remove this comment to see the full error message
      authenticity_token: document.getElementsByName(CSRF_TOKEN)[0].content,
    });
  } catch (e) {
    return Promise.reject(e.response);
  }
});

const get = instrument(async (url: $TSFixMe, config: $TSFixMe) => {
  try {
    return await axios.get(url, config);
  } catch (e) {
    return Promise.reject(e.response);
  }
});

const deleteAsync = instrument(async (url: $TSFixMe, config: $TSFixMe) => {
  return axios.delete(url, config);
});

const deleteWithCSRF = instrument(async (url: $TSFixMe) => {
  try {
    return await axios.delete(url, {
      data: {
        // Fetch the CSRF token from the DOM.
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'content' does not exist on type 'HTMLEle... Remove this comment to see the full error message
        authenticity_token: document.getElementsByName(CSRF_TOKEN)[0].content,
      },
    });
  } catch (e) {
    return Promise.reject(e.response);
  }
});

export {
  get,
  postWithCSRF,
  putWithCSRF,
  deleteAsync,
  deleteWithCSRF,
  MAX_SAMPLES_FOR_GET_REQUEST,
};
