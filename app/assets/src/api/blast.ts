import { get, postWithCSRF } from "./core";

export enum CountTypes {
  NT = "NT",
  NR = "NR",
}

export const fetchLongestContigsForTaxonId = ({
  sampleId,
  pipelineVersion,
  taxonId,
}) =>
  get(`/samples/${sampleId}/taxid_contigs_for_blast.json`, {
    params: {
      taxid: taxonId,
      pipeline_version: pipelineVersion,
      count_type: CountTypes.NT,
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
      count_type: CountTypes.NT,
    },
  });

export const createAnnotation = ({ pipelineRunId, taxId, annotationType }) =>
  postWithCSRF(`/annotations.json`, {
    pipeline_run_id: pipelineRunId,
    tax_id: taxId,
    content: annotationType,
  });
