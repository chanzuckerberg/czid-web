import { BLAST_HELP_LINK } from "~/components/utils/documentationLinks";

export const BLAST_CONTIG_ROW_WIDTH = 38; // px
export const BLAST_CONTIG_HEADER_ROW_WIDTH = 36; // px
export const SESSION_STORAGE_AUTO_REDIRECT_BLAST_KEY = "blast";
export const NCBI_SUPPORT_CENTER_LINK = "https://support.nlm.nih.gov/";
export const BLAST_SEQUENCE_CHARACTER_LIMIT = 7900;

export enum CountTypes {
  NT = "NT",
  NR = "NR",
}

export enum BlastMethods {
  BlastX = "blastx",
  BlastN = "blastn",
}

export interface BlastOption {
  blastType: string;
  description: string;
  learnMoreLink: string;
  listItems: string[];
  disabledTooltipText?: string;
}

export interface BlastModalInfo {
  availableCountTypeTabsForContigs?: string[];
  availableCountTypeTabsForReads?: string[];
  selectedBlastType: string;
  showCountTypeTabs: boolean;
  shouldBlastContigs: boolean;
}

export interface Contig {
  contig_id: number;
  contig_length: number;
  contig_name: string;
  fasta_sequence: string;
  num_reads: number;
}

export const BLAST_OPTIONS: BlastOption[] = [
  {
    blastType: BlastMethods.BlastN,
    description:
      "BLASTN compares nucleotide query sequence(s) to the nucleotide (NT) databases in NCBI. Available for sequence hits to the NT databases.",
    learnMoreLink: BLAST_HELP_LINK,
    listItems: [
      "BLASTN contigs helps you: confirm hits, check contig quality and orientation, Collect metrics for publication.",
      "BLASTN reads confirm hits, determine region of coverage.",
    ],
    disabledTooltipText: "Requires a hit to NT.",
  },
  {
    blastType: BlastMethods.BlastX,
    description:
      "BLASTX compares query sequence(s) to the protein (NR) databases in NCBI. Available for sequence hits to the NT and NR databases.",
    learnMoreLink: BLAST_HELP_LINK,
    listItems: [
      "BLASTX helps you identify proteins, and confirm the precence of divergent viruses hits.",
    ],
  },
];

export const CountTypeToIndex = {
  [CountTypes.NT]: 0,
  [CountTypes.NR]: 1,
};

export const IndexToCountType = {
  0: CountTypes.NT,
  1: CountTypes.NR,
};
