import { get } from "./core";

export const getAMRCounts = sampleIds =>
  get("amr_heatmap/amr_counts.json", {
    params: {
      sampleIds,
    },
  });

export const getCARDInfo = geneName =>
  get("amr_heatmap/fetch_card_info.json", {
    params: {
      geneName,
    },
  });
