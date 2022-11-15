export type Workflow = {
  id: number;
  workflow: string;
  created_at: string;
  status: string;
  cached_results: {
    quality_metrics: {
      total_reads: number;
      qc_percent: number;
      adjusted_remaining_reads: number;
      compression_ratio: number;
      total_ercc_reads: number;
      fraction_subsampled: number;
      insert_size_mean: string | undefined;
      insert_size_standard_deviation: string | undefined;
      percent_remaining: number;
    };
  };
  inputs: {
    accession_id: string | undefined;
    accession_name: string | undefined;
    medaka_model: string | undefined;
    taxon_name: string | undefined;
    technology: string | undefined;
    wetlab_protocol: string | undefined;
    ref_fasta: string | undefined;
    primer_bed: string | undefined;
  };
  sample: {
    info: {
      id: number;
      created_at: string;
      host_genome_name: string;
      name: string;
      private_until: string;
      project_id: number;
      sample_notes: string | undefined;
      public: number;
    };
    metadata: {
      collection_date: string;
      collection_location_v2: {
        name: string;
        geo_level: string;
        country_name: string;
        state_name: "";
        subdivision_name: string;
        city_name: string;
        lat: number;
        lng: number;
        country_id: number;
        state_id: string | undefined;
        subdivision_id: string | undefined;
        city_id: string | undefined;
      };
      nucleotide_type: string;
      sample_type: string;
      water_control: string;
    };
    project_name: string;
    uploader: {
      name: string;
      id: number;
    };
  };
};
