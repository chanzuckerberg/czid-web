import { get } from "./core";

export const getAMRCounts = sampleIds =>
  get("amr_heatmap/amr_counts.json", {
    params: {
      sampleIds,
    },
  });

export const getCARDIndex = () => get("amr_heatmap/fetch_card_index.json");

export const getAroEntry = accession =>
  get("amr_heatmap/fetch_aro_entry.json", {
    params: {
      accession,
    },
  });
