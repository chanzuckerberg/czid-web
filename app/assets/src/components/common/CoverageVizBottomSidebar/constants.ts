// Lighter shade of primary blue.
export const READ_FILL_COLOR = "#A9BDFC";
export const CONTIG_FILL_COLOR = "#3867FA";
export const REF_ACC_COLOR = "#EAEAEA";

export const BLAST_NOT_AVAILABLE =
  "BLAST is only available for taxa with at least one contig matching NT";

export const METRIC_COLUMNS = [
  [
    {
      key: "referenceNCBIEntry",
      name: "NCBI Reference",
      tooltip: "The NCBI Genbank entry for the reference accession.",
    },
    {
      key: "customReference",
      name: "Custom Reference",
      tooltip: "The custom reference you uploaded with this sample.",
    },
    {
      key: "referenceLength",
      name: "Reference Length",
      tooltip: "Length in base pairs of the reference accession.",
    },
  ],
  [
    {
      key: "alignedContigs",
      name: "Aligned Contigs",
      tooltip: "Number of contigs for which this accession was the best match.",
    },
    {
      key: "alignedReads",
      name: "Aligned Loose Reads",
      tooltip:
        "Number of reads for which this accession was the best match. Only includes reads which did not assemble into a contig.",
    },
  ],
  [
    {
      key: "coverageDepth",
      name: "Coverage Depth",
      tooltip:
        "The average read depth of aligned contigs and reads over the length of the accession.",
    },
    {
      key: "coverageBreadth",
      name: "Coverage Breadth",
      tooltip:
        "The percentage of the accession that is covered by at least one read or contig.",
    },
  ],
  [
    {
      key: "maxAlignedLength",
      name: "Max Alignment Length",
      tooltip:
        "Length of the longest aligned region over all reads and contigs.",
    },
    {
      key: "avgMismatchedPercent",
      name: "Avg. Mismatched %",
      tooltip:
        "Percentage of aligned regions that are mismatches, averaged over all reads and contigs.",
    },
  ],
];
