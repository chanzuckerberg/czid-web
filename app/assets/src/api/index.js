// TODO(mark): Split this file up as more API methods get added.
import axios from "axios";

const postWithCSRF = async (url, params) => {
  const resp = await axios.post(url, {
    ...params,
    // Fetch the CSRF token from the DOM.
    authenticity_token: document.getElementsByName("csrf-token")[0].content
  });

  // Just return the data.
  // resp also contains headers, status, etc. that we might use later.
  return resp.data;
};

const get = async url => {
  const resp = await axios.get(url);

  return resp.data;
};

const getSampleMetadata = id => get(`/samples/${id}/metadata`);

const saveSampleMetadata = (id, field, value) =>
  postWithCSRF(`/samples/${id}/save_metadata_v2`, {
    field,
    value
  });

const getMetadataTypes = () => get("/samples/metadata_types");

export { getSampleMetadata, saveSampleMetadata, getMetadataTypes };
