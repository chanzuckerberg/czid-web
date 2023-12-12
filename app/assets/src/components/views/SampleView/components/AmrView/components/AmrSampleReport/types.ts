export interface AmrResult {
  contigCoverageBreadth: string | null;
  contigPercentId: string | null;
  contigs: string | null;
  contigSpecies: string | null;
  cutoff: string | null;
  dpm: number | null;
  drugClass: string | null;
  highLevelDrugClass: string | null;
  gene: string | null;
  geneFamily: string | null;
  mechanism: string | null;
  model: string | null;
  readCoverageBreadth: string | null;
  readCoverageDepth: string | null;
  reads: string | null;
  readSpecies: string | null;
  rpm: number | null;
}

export interface AmrWorkflowResult {
  quality_metrics: {
    adjusted_remaining_reads: number;
    compression_ratio: number;
    fraction_subsampled: number;
    insert_size_mean: number;
    insert_size_standard_deviation: number;
    percent_remaining: number;
    qc_percent: number;
    total_ercc_reads: number;
    total_reads: number;
  };
  report_data_table: AmrResult[];
}
