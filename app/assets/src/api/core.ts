import axios from "axios";
import { getCsrfToken } from "./utils";

const MAX_SAMPLES_FOR_GET_REQUEST = 256;

const postWithCSRF = async (url: $TSFixMe, ...params: $TSFixMe) => {
  try {
    // resp also contains headers, status, etc. that we might use later.
    const resp = await axios.post(url, {
      ...params,
      // Fetch the CSRF token from the DOM.
      authenticity_token: getCsrfToken(),
    });
    // Just return the data.
    return resp.data;
  } catch (e) {
    return Promise.reject(e.response.data);
  }
};

// TODO(mark): Remove redundancy in CSRF methods.
const putWithCSRF = async (url: $TSFixMe, ...params: $TSFixMe) => {
  try {
    // resp also contains headers, status, etc. that we might use later.
    const resp = await axios.put(url, {
      ...params,
      // Fetch the CSRF token from the DOM.
      authenticity_token: getCsrfToken(),
    });
    // Just return the data.
    return resp.data;
  } catch (e) {
    return Promise.reject(e.response.data);
  }
};

const get = async (url: $TSFixMe, ...config: $TSFixMe) => {
  try {
    const resp = await axios.get(url, config);
    // Just return the data.
    return resp.data;
  } catch (e) {
    return Promise.reject(e.response.data);
  }
};

const deleteWithCSRF = async (url: $TSFixMe) => {
  try {
    const resp = await axios.delete(url, {
      data: {
        // Fetch the CSRF token from the DOM.
        authenticity_token: getCsrfToken(),
      },
    });
    return resp.data;
  } catch (e) {
    return Promise.reject(e.response.data);
  }
};

export {
  get,
  postWithCSRF,
  putWithCSRF,
  deleteWithCSRF,
  MAX_SAMPLES_FOR_GET_REQUEST,
};
