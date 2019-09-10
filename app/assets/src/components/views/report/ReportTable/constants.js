const DOC_LINK =
  "https://github.com/chanzuckerberg/idseq-dag/wiki/IDseq-Pipeline-Stage-%233:-Reporting-and-Visualization#reports";

export const REPORT_TABLE_COLUMNS = {
  NT_aggregatescore: {
    title: "Aggregate score",
    tooltip:
      "Experimental ranking score for prioritizing microbes based on abundance within the sample (rPM) as well as compared to control samples (Z-score).",
    link: DOC_LINK,
  },
  zscore: {
    title: "Z-score",
    tooltip:
      "Statistic used for evaluating the prevelance of microbes in your sample as compared to background contaminants.",
    link: DOC_LINK,
  },
  rpm: {
    tooltip:
      "Number of reads aligning to the taxon in the NCBI NR/NT database, per million reads sequenced.",
    link: DOC_LINK,
  },
  r: {
    tooltip:
      "Number of reads aligning to the taxon in the NCBI NT/NR database.",
    link: DOC_LINK,
  },
  contigs: {
    tooltip:
      "Number of assembled contigs aligning to the taxon in the NCBI NT/NR database.",
    link: DOC_LINK,
  },
  contigreads: {
    tooltip: "Total number reads across all assembled contigs.",
    link: DOC_LINK,
  },
  percentidentity: {
    tooltip: "Average percent-identity of alignments to NCBI NT/NR.",
    link: DOC_LINK,
  },
  alignmentlength: {
    tooltip:
      "Average length of the local alignment for all contigs and reads assigned to this taxon.",
    link: DOC_LINK,
  },
  neglogevalue: {
    tooltip:
      "Average log10 transformed expect value (e-value) of alignments to NCBI NT/NR.",
    link: DOC_LINK,
  },
};
