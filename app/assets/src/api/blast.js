import { get, postWithCSRF } from "./core";

export const fetchLongestContigsForTaxonId = ({
  sampleId,
  pipelineVersion,
  taxonId,
}) =>
  get(`/samples/${sampleId}/taxid_contigs.json`, {
    params: {
      taxid: taxonId,
      pipeline_version: pipelineVersion,
    },
  });

export const createAnnotation = ({ pipelineRunId, taxId, annotationType }) =>
  postWithCSRF(`/annotations.json`, {
    pipeline_run_id: pipelineRunId,
    tax_id: taxId,
    content: annotationType,
  });
