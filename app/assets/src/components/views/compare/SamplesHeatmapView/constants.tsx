import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";

export enum HeatmapDownloadType {
  ALL_METRICS = "all_metrics",
  CURRENT_METRICS = "current_metrics",
  BIOM_FORMAT = "biom_format",
  PNG = "png",
  SVG = "svg",
}

export const HEATMAP_FILTERS = [
  "metric",
  "thresholdFilters",
  "readSpecificity",
  "species",
  "categories",
  "subcategories",
  "taxonsPerSample",
  "taxonTags",
];

export const APPLIED_FILTERS = [
  "thresholdFilters",
  "readSpecificity",
  "categories",
  "subcategories",
  "taxonTags",
];

export const MICROBIOME_DOWNLOAD_METRIC_OPTIONS = [
  { text: "NT rPM", value: "NT.rpm" },
  { text: "NT r (total reads)", value: "NT.r" },
  { text: "NR rPM", value: "NR.rpm" },
  { text: "NR r (total reads)", value: "NR.r" },
];

export interface HeatmapDownloadOption {
  category: string;
  description?: string | JSX.Element;
  displayName: string;
  fileTypeDisplay: string;
  metricOptions?: { text: string; value: string }[];
  type: HeatmapDownloadType;
}

export const HEATMAP_DOWNLOAD_REPORT_OPTIONS: HeatmapDownloadOption[] = [
  {
    category: "reports",
    description:
      "Contains all metrics in all taxa for all samples. Existing filters on the heatmap will not apply.",
    displayName: "All Heatmap Metrics",
    fileTypeDisplay: ".csv",
    type: HeatmapDownloadType.ALL_METRICS,
  },
  {
    category: "reports",
    description:
      "Contains the current selected metric. Existing filters on the heatmap will apply.",
    displayName: "Current Heatmap Metrics",
    fileTypeDisplay: ".csv",
    type: HeatmapDownloadType.CURRENT_METRICS,
  },
  {
    category: "reports",
    description: (
      <React.Fragment>
        Sample report data (samples x taxons) combined with all sample metadata
        and taxon metadata in{" "}
        <ExternalLink href="https://biom-format.org/">BIOM</ExternalLink> format
        compatible with{" "}
        <ExternalLink href="https://microbiomedb.org/mbio/app">
          MicrobiomeDB
        </ExternalLink>
        .{" "}
        <ExternalLink href="https://chanzuckerberg.zendesk.com/hc/en-us/articles/360042575714-Initiate-a-Bulk-Download">
          Learn More
        </ExternalLink>
      </React.Fragment>
    ),
    displayName: "Combined Microbiome File",
    metricOptions: MICROBIOME_DOWNLOAD_METRIC_OPTIONS,
    fileTypeDisplay: ".biom",
    type: HeatmapDownloadType.BIOM_FORMAT,
  },
];

export const HEATMAP_DOWNLOAD_IMAGE_OPTIONS: HeatmapDownloadOption[] = [
  {
    category: "images",
    displayName: "Heatmap Image",
    fileTypeDisplay: ".png",
    type: HeatmapDownloadType.PNG,
  },
  {
    category: "images",
    displayName: "Heatmap Image",
    fileTypeDisplay: ".svg",
    type: HeatmapDownloadType.SVG,
  },
];

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
  customBackground: "custom_background_slow_with_es",
  multipleIndexVersions: "multiple_index_versions",
  backgroundDifferentIndexVersion: "background_diff_index_version",
};

export const MASS_NORMALIZED_PIPELINE_VERSION = 4.0;

export const TAXON_HEATMAP_MODAL_SAMPLES_MINIMUM = 50;

export const THRESHOLDS = [
  { text: "NT Z Score", value: "NT_zscore" },
  { text: "NT rPM", value: "NT_rpm" },
  { text: "NT r (total reads)", value: "NT_r" },
  { text: "NT %id", value: "NT_percentidentity" },
  { text: "NT L (alignment length in bp)", value: "NT_alignmentlength" },
  { text: "NT E Value (as a power of 10)", value: "NT_logevalue" },
  { text: "NR Z Score", value: "NR_zscore" },
  { text: "NR r (total reads)", value: "NR_r" },
  { text: "NR rPM", value: "NR_rpm" },
  { text: "NR %id", value: "NR_percentidentity" },
  { text: "NR L (alignment length in bp)", value: "NR_alignmentlength" },
  { text: "NR E Value (as a power of 10)", value: "NR_logevalue" },
];

export const SPECIES_SELECTION_OPTIONS = {
  species: 1,
  genus: 0,
};
