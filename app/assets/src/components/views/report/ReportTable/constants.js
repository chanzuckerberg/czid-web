export const REPORT_TABLE_COLUMNS = {
  NT_aggregatescore: {
    title: "Aggregate score",
    tooltip:
      "Experimental ranking score for prioritizing microbes based on abundance within the sample (rPM) as well as compared to control samples (Z-score).",
    link:
      "https://help.idseq.net/hc/en-us/articles/360034790574-Single-Sample-Report-Table#score",
  },
  zscore: {
    title: "Z-score",
    tooltip:
      "Statistic used for evaluating the prevelance of microbes in the sample as compared to background contaminants.",
    link:
      "https://help.idseq.net/hc/en-us/articles/360034790574-Single-Sample-Report-Table#z-score",
  },
  rpm: {
    tooltip:
      "Number of reads aligning to the taxon in the NCBI NR/NT database, per million reads sequenced.",
    link:
      "https://help.idseq.net/hc/en-us/articles/360034790574-Single-Sample-Report-Table#rpm",
  },
  r: {
    tooltip:
      "Number of reads aligning to the taxon in the NCBI NT/NR database.",
    link:
      "https://help.idseq.net/hc/en-us/articles/360034790574-Single-Sample-Report-Table#reads",
  },
  contigs: {
    tooltip:
      "Number of assembled contigs aligning to the taxon in the NCBI NT/NR database.",
    link:
      "https://help.idseq.net/hc/en-us/articles/360034790574-Single-Sample-Report-Table#contig",
  },
  contigreads: {
    tooltip: "Total number of reads across all assembled contigs.",
    link:
      "https://help.idseq.net/hc/en-us/articles/360034790574-Single-Sample-Report-Table#contig-r",
  },
  percentidentity: {
    tooltip: "Average percent-identity of alignments to NCBI NT/NR.",
    link:
      "https://help.idseq.net/hc/en-us/articles/360034790574-Single-Sample-Report-Table#identity-match",
  },
  alignmentlength: {
    tooltip:
      "Average length of the local alignment for all contigs and reads assigned to this taxon.",
    link:
      "https://help.idseq.net/hc/en-us/articles/360034790574-Single-Sample-Report-Table#average-length",
  },
  neglogevalue: {
    tooltip:
      "Average log10 transformed expect value (e-value) of alignments to NCBI NT/NR.",
    link:
      "https://help.idseq.net/hc/en-us/articles/360034790574-Single-Sample-Report-Table#inverse-of-e-value",
  },
};
