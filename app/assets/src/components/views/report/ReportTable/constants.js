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
};
