import { get } from "./core";

export const getAMRCounts = async sampleIds =>
  get("amr_heatmap/amr_counts.json", {
    params: {
      sampleIds,
    },
  });
