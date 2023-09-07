import { AmrDeprectatedData } from "~/interface/sampleView";
import { get } from "./core";

export const getAMRCounts = (sampleIds: $TSFixMe) =>
  get("amr_heatmap/amr_counts.json", {
    params: {
      sampleIds,
    },
  });

export const getOntology = (geneName: $TSFixMe) =>
  get("/amr_ontology/fetch_ontology.json", {
    params: {
      geneName,
    },
  });

export const getAmrDeprecatedData = (sampleId): Promise<AmrDeprectatedData[]> =>
  get(`/samples/${sampleId}/amr.json`);
