import { get } from "./core";

export const getAMRCounts = async sampleIds =>
  get("amr_heatmap/amr_counts.json", {
    params: {
      sampleIds,
    },
  });

export const getCARDInfo = async accession =>
  get("amr_heatmap/fetch_card.json", {
    params: {
      accession,
    },
  });
