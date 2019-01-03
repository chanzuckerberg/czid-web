// TODO(mark): Split this file up as more API methods get added.
import axios from "axios";
import { toPairs } from "lodash/fp";
import { cleanLocalFilePath } from "~utils/sample";

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

// TODO: add error handling
const get = async (url, config) => {
  const resp = await axios.get(url, config);

  return resp.data;
};

const deleteWithCSRF = url =>
  axios.delete(url, {
    data: {
      // Fetch the CSRF token from the DOM.
      authenticity_token: document.getElementsByName("csrf-token")[0].content
    }
  });

const getURLParamString = params =>
  toPairs(params)
    .map(pair => pair.join("="))
    .join("&");

const getSampleMetadata = (id, pipelineVersion) => {
  return get(
    pipelineVersion
      ? `/samples/${id}/metadata?pipeline_version=${pipelineVersion}`
      : `/samples/${id}/metadata`
  );
};

const saveSampleMetadata = (id, field, value) =>
  postWithCSRF(`/samples/${id}/save_metadata_v2`, {
    field,
    value
  });

const getMetadataTypesByHostGenomeName = () =>
  get("/samples/metadata_types_by_host_genome_name");

// Save fields on the sample model (NOT sample metadata)
const saveSampleField = (id, field, value) =>
  postWithCSRF(`/samples/${id}/save_metadata`, {
    field,
    value
  });

const saveSampleName = (id, name) => saveSampleField(id, "name", name);

const saveSampleNotes = (id, sampleNotes) =>
  saveSampleField(id, "sample_notes", sampleNotes);

const getAlignmentData = (sampleId, alignmentQuery, pipelineVersion) =>
  get(
    `/samples/${sampleId}/alignment_viz/${alignmentQuery}.json?pipeline_version=${pipelineVersion}`
  );

const deleteSample = id => deleteWithCSRF(`/samples/${id}.json`);

const getSampleReportInfo = (id, params) =>
  get(`/samples/${id}/report_info${params}`);

const getSummaryContigCounts = (id, minContigSize) =>
  get(`/samples/${id}/summary_contig_counts?min_contig_size=${minContigSize}`);

const createSampleFromLocal = (
  sampleName,
  localFiles,
  projectName,
  projectId,
  hostId
) =>
  new Promise((resolve, reject) => {
    const fileAttributes = Array.from(localFiles, file => {
      const path = cleanLocalFilePath(file.name);
      return {
        source_type: "local",
        source: path,
        parts: path
      };
    });

    axios
      .post("/samples.json", {
        sample: {
          name: sampleName,
          project_name: projectName,
          project_id: projectId,
          input_files_attributes: fileAttributes,
          host_genome_id: hostId,
          status: "created",
          client: "web"
        },
        authenticity_token: document.getElementsByName("csrf-token")[0].content
      })
      .then(response => {
        resolve(response);
      })
      .catch(error => {
        reject(error);
      });
  });

export {
  get,
  getSampleMetadata,
  getSampleReportInfo,
  saveSampleMetadata,
  getMetadataTypesByHostGenomeName,
  saveSampleName,
  saveSampleNotes,
  getAlignmentData,
  getURLParamString,
  deleteSample,
  getSummaryContigCounts,
  createSampleFromLocal
};
