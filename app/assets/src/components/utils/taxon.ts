import { get } from "lodash/fp";

export const getTaxonMetric = (
  taxon: $TSFixMe,
  type: $TSFixMe,
  metric: $TSFixMe,
) => {
  if (metric === "contigs" || metric === "contigreads") {
    return get(["summaryContigCounts", type, metric], taxon) || 0;
  }
  return taxon[type][metric];
};

export const getCategoryAdjective = (category: $TSFixMe) => {
  const categoryLowercase = category.toLowerCase();
  switch (categoryLowercase) {
    case "bacteria":
      return "bacterial";
    case "archaea":
      return "archaeal";
    case "eukaryota":
      return "eukaryotic";
    case "viruses":
      return "viral";
    case "viroids":
      return "viroidal";
    case "uncategorized":
      return "uncategorized";
    default:
      return categoryLowercase;
  }
};
