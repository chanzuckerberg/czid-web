import { WORKFLOWS } from "~/components/utils/workflows";

export const TABS = {
  CONSENSUS_GENOME: WORKFLOWS.CONSENSUS_GENOME.label,
  SHORT_READ_MNGS: WORKFLOWS.SHORT_READ_MNGS.label,
  AMR: "Antimicrobial Resistance",
  MERGED_NT_NR: "Metagenomics - Simplified",
};

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

export const MASS_NORMALIZED_PIPELINE_VERSION = "4.0";

const DOC_BASE_LINK =
  "https://help.idseq.net/hc/en-us/articles/360034790574-Single-Sample-Report-Table";

export const REPORT_TABLE_COLUMNS = {
  NT_aggregatescore: {
    title: "Aggregate score",
    tooltip:
      "Experimental ranking score for prioritizing microbes based on abundance within the sample (rPM) as well as compared to control samples (Z-score).",
    link: DOC_BASE_LINK + "#score",
  },
  zscore: {
    title: "Z-score",
    tooltip:
      "Statistic used for evaluating the prevelance of microbes in the sample as compared to background contaminants.",
    link: DOC_BASE_LINK + "#z-score",
  },
  rpm: {
    tooltip:
      "Number of reads aligning to the taxon in the NCBI NR/NT database, per million reads sequenced.",
    link: DOC_BASE_LINK + "#rpm",
  },
  r: {
    tooltip:
      "Number of reads aligning to the taxon in the NCBI NT/NR database.",
    link: DOC_BASE_LINK + "#reads",
  },
  contigs: {
    tooltip:
      "Number of assembled contigs aligning to the taxon in the NCBI NT/NR database.",
    link: DOC_BASE_LINK + "#contig",
  },
  contigreads: {
    tooltip: "Total number of reads across all assembled contigs.",
    link: DOC_BASE_LINK + "#contig-r",
  },
  percentidentity: {
    tooltip: "Average percent-identity of alignments to NCBI NT/NR.",
    link: DOC_BASE_LINK + "#identity-match",
  },
  alignmentlength: {
    tooltip:
      "Average length of the local alignment for all contigs and reads assigned to this taxon.",
    link: DOC_BASE_LINK + "#average-length",
  },
  neglogevalue: {
    tooltip:
      "Average log10 transformed expect value (e-value) of alignments to NCBI NT/NR.",
    link: DOC_BASE_LINK + "#inverse-of-e-value",
  },
  sourceCountType: {
    tooltip: "The DB that the single merged NT/NR value was derived from",
  },
  unavailable: {
    tooltip:
      "Unavailable for prototype. Value would be available when released",
  },
};
