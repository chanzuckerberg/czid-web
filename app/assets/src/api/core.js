import axios from "axios";

const postWithCSRF = async (url, params) => {
  try {
    const resp = await axios.post(url, {
      ...params,
      // Fetch the CSRF token from the DOM.
      authenticity_token: document.getElementsByName("csrf-token")[0].content
    });

    // Just return the data.
    // resp also contains headers, status, etc. that we might use later.
    return resp.data;
  } catch (e) {
    return Promise.reject(e.response.data);
  }
};

// TODO(mark): Remove redundancy in CSRF methods.
const putWithCSRF = async (url, params) => {
  try {
    const resp = await axios.put(url, {
      ...params,
      // Fetch the CSRF token from the DOM.
      authenticity_token: document.getElementsByName("csrf-token")[0].content
    });

    // Just return the data.
    // resp also contains headers, status, etc. that we might use later.
    return resp.data;
  } catch (e) {
    return Promise.reject(e.response.data);
  }
};

const get = async (url, config) => {
  try {
    const resp = await axios.get(url, config);

    return resp.data;
  } catch (e) {
    return Promise.reject(e.response.data);
  }
};

const deleteAsync = async (url, config) => {
  const resp = await axios.delete(url, config);

  return resp.data;
};

const deleteWithCSRF = async url => {
  try {
    const resp = await axios.delete(url, {
      data: {
        // Fetch the CSRF token from the DOM.
        authenticity_token: document.getElementsByName("csrf-token")[0].content
      }
    });

    return resp.data;
  } catch (e) {
    return Promise.reject(e.response.data);
  }
};

export { get, postWithCSRF, putWithCSRF, deleteAsync, deleteWithCSRF };
