import { get, postWithCSRF } from "./core";

export const fetchLongestContigsForTaxonId = ({
  sampleId,
  pipelineVersion,
  taxonId,
}) =>
  get(`/samples/${sampleId}/taxid_contigs_for_blast.json`, {
    params: {
      taxid: taxonId,
      pipeline_version: pipelineVersion,
    },
  });

export const fetchLongestReadsForTaxonId = ({
  sampleId,
  pipelineVersion,
  taxonId,
  taxonLevel,
}) =>
  get(`/samples/${sampleId}/taxon_five_longest_reads.json`, {
    params: {
      taxid: taxonId,
      tax_level: taxonLevel,
      pipeline_version: pipelineVersion,
    },
  });

export const createAnnotation = ({ pipelineRunId, taxId, annotationType }) =>
  postWithCSRF(`/annotations.json`, {
    pipeline_run_id: pipelineRunId,
    tax_id: taxId,
    content: annotationType,
  });
