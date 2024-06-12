import {
  AMR_DATABASE_HELP_LINK,
  SARS_COV_2_UPLOAD_LINK,
} from "~/components/utils/documentationLinks";

const TOOLTIP_BUFFER = 10;
const TOOLTIP_MAX_WIDTH = 400;

// Display the tooltip in the top left, unless it is too close
// to the right side of the screen. If it is too close to the bottom, show it
// above the curosr.
export const getTooltipStyle = (
  location: { top: number; left: number },
  params: { buffer?: number; below?: boolean; height?: number } = {},
) => {
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
  totalReadsCg: {
    label: "Total Reads",
    tooltip: "The total number of reads after human read removal.",
  },
  gcPercent: {
    label: "GC Content",
    tooltip:
      "The percentage of bases that are either guanine (G) or cytosine (C).",
  },
  refSnps: {
    label: "SNPs",
    tooltip:
      "The number of single nucleotide polymorphisms (SNPs) - locations where the nucleotide of the consensus genome does not match the base of the reference accession",
  },
  percentIdentity: {
    label: "%id",
    tooltip:
      "The percentage of nucleotides of the consensus genome that are identical to those in the reference accession.",
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
  customReference: {
    label: "Custom Reference",
    tooltip: "The custom reference you uploaded with this sample.",
  },
  referenceNCBIEntry: {
    label: "NCBI Reference",
    tooltip: "The NCBI Genbank entry for the reference accession.",
  },
  referenceLength: {
    label: "Reference Length",
    tooltip: "Length in base pairs of the reference accession.",
  },
  mappedReads: {
    label: "Mapped Reads",
    tooltip: "Number of reads aligning to the reference accession.",
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
  creationSource: {
    label: "Creation Source",
    tooltip:
      "Specifies where the consensus genome (CG) pipeline was initiated.",
  },
  referenceAccession: {
    label: "Reference Accession",
    tooltip: "The reference to which the non-host reads were aligned.",
  },
  referenceAccessionLength: {
    label: "Reference Accession Length",
    tooltip: "Length of reference accession in basepairs.",
  },
  medakaModel: {
    label: "Medaka Model",
    tooltip:
      "Medaka is a tool to create consensus sequences and variant calls from nanopore sequencing data.",
    link: SARS_COV_2_UPLOAD_LINK,
  },
  ct_value: {
    label: "Ct Value",
    tooltip:
      "The number of cycles required for the fluorescent signal to cross the background fluorescent threshold during qPCR. The value is inversely proportional to the amount of target nucleic acid.",
  },
  wildcardDatabaseVersion: {
    label: "WildCARD",
    tooltip:
      "Supplemental CARD module of predicted Resistomes, Variants, and Prevalence data.",
    link: AMR_DATABASE_HELP_LINK,
  },
};
