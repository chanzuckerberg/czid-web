export const SCALE_OPTIONS = [
  ["Log", "symlog"],
  ["Lin", "linear"],
];

export const SORT_SAMPLES_OPTIONS = [
  { text: "Alphabetical", value: "alpha" },
  { text: "Cluster", value: "cluster" },
];

export const TAXON_LEVEL_OPTIONS = {
  species: 1,
  genus: 2,
};

export const TAXON_LEVEL_SELECTED = {
  0: "genus",
  1: "species",
};

export const SORT_TAXA_OPTIONS = [
  { text: "Genus", value: "genus" },
  { text: "Cluster", value: "cluster" },
];

export const TAXONS_PER_SAMPLE_RANGE = {
  min: 1,
  max: 100,
};

export const SPECIFICITY_OPTIONS = [
  { text: "All", value: 0 },
  { text: "Specific Only", value: 1 },
];

export const METRIC_OPTIONS = [
  "NT.zscore",
  "NT.rpm",
  "NT.r",
  "NR.zscore",
  "NR.rpm",
  "NR.r",
];

export const BACKGROUND_METRICS = [
  { text: "NT Z Score", value: "NT.zscore" },
  { text: "NR Z Score", value: "NR.zscore" },
];

export const NOTIFICATION_TYPES = {
  invalidSamples: "invalid samples",
  taxaFilteredOut: "taxa filtered out",
  multiplePipelineVersions: "diverse_pipelines",
};

export const MASS_NORMALIZED_PIPELINE_VERSION = 4.0;
