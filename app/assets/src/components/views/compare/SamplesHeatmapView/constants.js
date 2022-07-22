import React from "react";
import ExternalLink from "~/components/ui/controls/ExternalLink";

// TODO: Remove DOWNLOAD_OPTIONS when microbiome feature is launched;
// it will be replaced by HEATMAP_DOWNLOAD_OPTIONS.
export const DOWNLOAD_OPTIONS = [
  { text: "Download All Heatmap Metrics (.csv)", value: "csv_metrics" },
  {
    text: "Download Current Heatmap View (.csv)",
    value: "current_heatmap_view_csv",
  },
  { text: "Download SVG", value: "svg" },
  { text: "Download PNG", value: "png" },
];

export const HEATMAP_FILTERS = [
  "metric",
  "thresholdFilters",
  "readSpecificity",
  "species",
  "categories",
  "subcategories",
  "taxonsPerSample",
];

export const HEATMAP_DOWNLOAD_CATEGORIES = ["reports", "images"];

export const HEATMAP_DOWNLOAD_OPTIONS = [
  {
    category: "reports",
    description:
      "User-uploaded metadata, including sample collection location, collection date, sample type",
    display_name: "All Heatmap Metrics",
    file_type_display: ".csv",
    type: "all_metrics",
  },
  {
    category: "reports",
    description:
      "User-uploaded metadata, including sample collection location, collection date, sample type",
    display_name: "Current Heatmap Metrics",
    file_type_display: ".csv",
    type: "current_metrics",
  },
  {
    admin_only: true,
    category: "reports",
    description: (
      // TODO: Replace the hrefs with the actual links once they're available.
      <React.Fragment>
        Sample report data (samples x taxons) combined with all sample metadata
        and taxon metadata in{" "}
        <ExternalLink href="https://help.czid.org">BIOM</ExternalLink> format.{" "}
        <ExternalLink href="https://help.czid.org">Learn more</ExternalLink>
      </React.Fragment>
    ),
    display_name: "Combined Microbiome File",
    fields: [
      {
        display_name: "Download Metric",
        type: "metric",
      },
    ],
    file_type_display: ".biom",
    type: "biom_format",
  },
  {
    category: "images",
    display_name: "Heatmap Image",
    file_type_display: ".png",
    type: "png",
  },
  {
    category: "images",
    display_name: "Heatmap Image",
    file_type_display: ".svg",
    type: "svg",
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

export const MICROBIOME_DOWNLOAD_METRIC_OPTIONS = [
  { text: "NT rPM", value: "NT.rpm" },
  { text: "NT r (total reads)", value: "NT.r" },
  { text: "NR rPM", value: "NR.rpm" },
  { text: "NR r (total reads)", value: "NR.r" },
];
