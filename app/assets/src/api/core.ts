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
  const wrapper = async (url: $TSFixMe, ...args: $TSFixMe[]) => {
    const startTime = performance.now();
    try {
      const result = await func
        .apply(this, [url, ...args])
        .then(async (resp: $TSFixMe) => {
          !DEVELOPMENT_MODE &&
            postToFrontendMetrics(url, resp, performance.now() - startTime);
          return resp.data;
        });

      return result;
    } catch (errorResp) {
      !DEVELOPMENT_MODE &&
        postToFrontendMetrics(url, errorResp, performance.now() - startTime);
      return Promise.reject(errorResp);
    }
  };
  return wrapper;
};

const postWithCSRF = instrument(async (url: $TSFixMe, params: $TSFixMe) => {
  try {
    const resp = await axios.post(url, {
      ...params,
      // Fetch the CSRF token from the DOM.
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'content' does not exist on type 'HTMLEle... Remove this comment to see the full error message
      authenticity_token: document.getElementsByName("csrf-token")[0].content,
    });

    // resp also contains headers, status, etc. that we might use later.
    return resp;
  } catch (e) {
    return Promise.reject(e.response);
  }
});

// TODO(mark): Remove redundancy in CSRF methods.
const putWithCSRF = instrument(async (url: $TSFixMe, params: $TSFixMe) => {
  try {
    const resp = await axios.put(url, {
      ...params,
      // Fetch the CSRF token from the DOM.
      // @ts-expect-error ts-migrate(2339) FIXME: Property 'content' does not exist on type 'HTMLEle... Remove this comment to see the full error message
      authenticity_token: document.getElementsByName("csrf-token")[0].content,
    });

    // resp also contains headers, status, etc. that we might use later.
    return resp;
  } catch (e) {
    return Promise.reject(e.response);
  }
});

const get = instrument(async (url: $TSFixMe, config: $TSFixMe) => {
  try {
    const resp = await axios.get(url, config);
    return resp;
  } catch (e) {
    return Promise.reject(e.response);
  }
});

const deleteAsync = instrument(async (url: $TSFixMe, config: $TSFixMe) => {
  const resp = await axios.delete(url, config);
  return resp;
});

const deleteWithCSRF = instrument(async (url: $TSFixMe) => {
  try {
    const resp = await axios.delete(url, {
      data: {
        // Fetch the CSRF token from the DOM.
        // @ts-expect-error ts-migrate(2339) FIXME: Property 'content' does not exist on type 'HTMLEle... Remove this comment to see the full error message
        authenticity_token: document.getElementsByName("csrf-token")[0].content,
      },
    });

    return resp;
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
