import { get } from "./core";

export const getAMRCounts = async sampleIds =>
  get("amr_heatmap/amr_counts.json", {
    params: {
      sampleIds,
    },
  });

export const getCARDIndex = async accession =>
  get("amr_heatmap/fetch_card_index.json");

export const getAroEntry = async accession =>
  get("amr_heatmap/fetch_aro_entry.json", {
    params: {
      accession,
    },
  });
