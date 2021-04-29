import { VADR_ANCHOR_LINK } from "~/components/utils/documentationLinks";

const TOOLTIP_BUFFER = 10;
const TOOLTIP_MAX_WIDTH = 400;

// Display the tooltip in the top left, unless it is too close
// to the right side of the screen. If it is too close to the bottom, show it
// above the curosr.
export const getTooltipStyle = (location, params = {}) => {
  const buffer = params.buffer || TOOLTIP_BUFFER;
  const topBufferSign = params.below ? 1 : -1;
  let top = location.top;

  if (params.height && top + params.height > window.innerHeight) {
    top = top - params.height;
  }

  if (location.left > window.innerWidth - TOOLTIP_MAX_WIDTH) {
    const right = window.innerWidth - location.left;
    return {
      right: right + buffer,
      top: top + topBufferSign * buffer,
    };
  } else {
    return {
      left: location.left + buffer,
      top: top + topBufferSign * buffer,
    };
  }
};

// General unordered lookup for any dataKey, label, tooltip combination.
// - Don't add fields unless they are consistent everywhere (e.g. same label and tooltip in all places, but not same className).
// - Use camelCase key names.
export const FIELDS_METADATA = {
  totalReadsCG: {
    label: "Total Reads",
    tooltip:
      "The total number of single-end reads uploaded. Each end of the paired-end reads count as one read.",
  },
  gcPercent: {
    label: "GC Content",
    tooltip:
      "The percentage of bases that are either guanine (G) or cytosine (C).",
  },
  refSnps: {
    label: "SNPs",
    tooltip:
      "The number of single nucleotide polymorphisms (SNPs) - locations where the nucleotide of the consensus genome does not match the base of the reference genome",
  },
  percentIdentity: {
    label: "%id",
    tooltip:
      "The percentage of nucleotides of the consensus genome that are identical to those in the reference genome.",
  },
  nActg: {
    label: "Informative Nucleotides",
    tooltip:
      "The number of nucleotides that are A,T,C, or G. Nucleotides are only called if 10 or more reads aligned.",
  },
  nMissing: {
    label: "Missing Bases",
    tooltip:
      "The number of bases that are N's because they could not be called.",
  },
  nAmbiguous: {
    label: "Ambiguous Bases",
    tooltip:
      "The number of bases that could not be specified due to multiple observed alleles of single-base polymorphisms.",
  },
  wetlabProtocol: {
    label: "Wetlab Protocol",
    tooltip: "The method used to enrich for SARS-CoV-2.",
  },
  coverageDepth: {
    label: "Coverage Depth",
    tooltip:
      "The average read depth of aligned contigs and reads over the length of the accession.",
  },
  coverageBreadth: {
    label: "Coverage Breadth",
    tooltip:
      "The percentage of the accession that is covered by at least one read or contig.",
  },
  referenceNCBIEntry: {
    label: "Reference NCBI Entry",
    tooltip: "The NCBI Genbank entry for the reference accession.",
  },
  referenceLength: {
    label: "Reference Length",
    tooltip: "Length in base pairs of the reference accession.",
  },
  mappedReads: {
    label: "Mapped Reads",
    tooltip:
      "Number of reads aligning to the taxon in the NCBI NT/NR database.",
  },
  percentGenomeCalled: {
    label: "% Genome Called",
    tooltip:
      "The percentage of the genome meeting thresholds for calling consensus bases.",
  },
  technology: {
    label: "Sequencing Platform",
    tooltip: "The sequencing technology used for read generation.",
  },
  referenceGenome: {
    label: "Reference Genome",
    tooltip: "The reference to which the non-host reads were aligned.",
  },
  referenceGenomeLength: {
    label: "Reference Genome Length",
    tooltip: "Length of reference genome in basepairs.",
  },
  vadrPassFail: {
    label: "VADR",
    tooltip:
      "Viral Annotation Definer: a suite of tools used to determine if your consensus genome will pass the upload validation steps for NCBI and GISAID. Download errors and annotations on the results page.",
    link: VADR_ANCHOR_LINK,
  },
};
