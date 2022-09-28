import { get } from "./core";

export const getAMRCounts = (sampleIds: $TSFixMe) =>
  get("amr_heatmap/amr_counts.json", {
    params: {
      sampleIds,
    },
  });

export const getOntology = (geneName: $TSFixMe) =>
  get("amr_heatmap/fetch_ontology.json", {
    params: {
      geneName,
    },
  });

export const getAmrDeprecatedData = (sampleId: $TSFixMe) =>
  get(`/samples/${sampleId}/amr.json`);
