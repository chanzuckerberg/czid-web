import {
  TwoWayKeyListMap,
  TwoWayKeyStringMap,
} from "~/components/utils/objectUtil";

export enum ColumnSection {
  GENE_INFO = "Gene Info",
  CONTIGS = "Contigs",
  READS = "Reads",
}

export enum ColumnId {
  CONTIG_COVERAGE_BREADTH = "contigCoverageBreadth",
  CONTIG_PERCENT_ID = "contigPercentId",
  CONTIG_SPECIES = "contigSpecies",
  CONTIGS = "contigs",
  CUTOFF = "cutoff",
  DRUG_CLASS = "drugClass",
  GENE_FAMILY = "geneFamily",
  MECHANISM = "mechanism",
  MODEL = "model",
  READ_COVERAGE_DEPTH = "readCoverageDepth",
  READ_DEPTH_PER_MILLION = "readDepthPerMillion",
  READ_COVERAGE_BREADTH = "readCoverageBreadth",
  READ_SPECIES = "readSpecies",
  READS = "reads",
  READS_PER_MILLION = "readsPerMillion",
}

export const COLUMN_ID_TO_NAME = new TwoWayKeyStringMap({
  [ColumnId.CONTIG_COVERAGE_BREADTH]: "Contig Coverage Breadth",
  [ColumnId.CONTIG_PERCENT_ID]: "Contig %id",
  [ColumnId.CONTIG_SPECIES]: "Contig Species",
  [ColumnId.CONTIGS]: "Number of Contigs",
  [ColumnId.CUTOFF]: "Cutoff",
  [ColumnId.DRUG_CLASS]: "Drug Class",
  [ColumnId.GENE_FAMILY]: "Gene Family",
  [ColumnId.MECHANISM]: "Mechanism",
  [ColumnId.MODEL]: "Model",
  [ColumnId.READ_COVERAGE_DEPTH]: "Reads Coverage Depth",
  [ColumnId.READ_DEPTH_PER_MILLION]: "dPM (Depth per million)",
  [ColumnId.READ_COVERAGE_BREADTH]: "Read Coverage Breadth",
  [ColumnId.READ_SPECIES]: "Read Species",
  [ColumnId.READS]: "r (Number of reads)",
  [ColumnId.READS_PER_MILLION]: "rPM (Reads per million)",
});

export const SECTION_TO_COLUMN_IDS = new TwoWayKeyListMap({
  [ColumnSection.GENE_INFO]: [
    ColumnId.DRUG_CLASS,
    ColumnId.GENE_FAMILY,
    ColumnId.MECHANISM,
    ColumnId.MODEL,
  ],
  [ColumnSection.CONTIGS]: [
    ColumnId.CUTOFF,
    ColumnId.CONTIGS,
    ColumnId.CONTIG_COVERAGE_BREADTH,
    ColumnId.CONTIG_PERCENT_ID,
    ColumnId.CONTIG_SPECIES,
  ],
  [ColumnSection.READS]: [
    ColumnId.READS,
    ColumnId.READS_PER_MILLION,
    ColumnId.READ_COVERAGE_BREADTH,
    ColumnId.READ_COVERAGE_DEPTH,
    ColumnId.READ_DEPTH_PER_MILLION,
    ColumnId.READ_SPECIES,
  ],
});
