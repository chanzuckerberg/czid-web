import { get } from "./core";

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
