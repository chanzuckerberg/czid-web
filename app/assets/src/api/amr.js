import { get } from "./core";

export const getAMRCounts = sampleIds =>
  get("amr_heatmap/amr_counts.json", {
    params: {
      sampleIds,
    },
  });

export const getOntology = geneName =>
  get("amr_heatmap/fetch_ontology.json", {
    params: {
      geneName,
    },
  });

export const getAmrDeprecatedData = sampleId =>
  get(`/samples/${sampleId}/amr.json`);
