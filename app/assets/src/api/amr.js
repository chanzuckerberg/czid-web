import { get } from "./core";

export const getAMRCounts = sampleIds =>
  get("amr_heatmap/amr_counts.json", {
    params: {
      sampleIds,
    },
  });
