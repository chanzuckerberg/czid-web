export const THRESHOLDS = [
  { text: "Score", value: "agg_score" },
  { text: "NT Z Score", value: "nt:z_score" },
  { text: "NT rPM", value: "nt:rpm" },
  { text: "NT r (total reads)", value: "nt:count" },
  { text: "NT contigs", value: "nt:contigs" },
  { text: "NT contig reads", value: "nt:contig_r" },
  { text: "NT %id", value: "nt:percent_identity" },
  { text: "NT L (alignment length in bp)", value: "nt:alignment_length" },
  { text: "NT log(1/e)", value: "nt:e_value" },
  { text: "NR Z Score", value: "nr:z_score" },
  { text: "NR rPM", value: "nr:rpm" },
  { text: "NR r (total reads)", value: "nr:count" },
  { text: "NR contigs", value: "nr:contigs" },
  { text: "NR contig reads", value: "nr:contig_r" },
  { text: "NR %id", value: "nr:percent_identity" },
  { text: "NR L (alignment length in bp)", value: "nr:alignment_length" },
  { text: "NR log(1/e)", value: "nr:e_value" },
];

export const TREE_METRICS = [
  { text: "Aggregate Score", value: "aggregatescore" },
  { text: "NT r (total reads)", value: "nt_r" },
  { text: "NT rPM", value: "nt_rpm" },
  { text: "NR r (total reads)", value: "nr_r" },
  { text: "NR rPM", value: "nr_rpm" },
];

export const CATEGORIES = [
  { name: "Archaea" },
  { name: "Bacteria" },
  { name: "Eukaryota" },
  { name: "Viroids" },
  { name: "Viruses", children: ["Phage"] },
  { name: "Uncategorized" },
];

export const MASS_NORMALIZED_PIPELINE_VERSION = 4.0;
