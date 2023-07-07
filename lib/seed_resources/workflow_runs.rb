require 'factory_bot'
require_relative 'seed_resource'

module SeedResource
  class WorkflowRuns < Base
    def initialize(sample, workflow_run_data)
      @sample = sample
      @workflow_run_data = workflow_run_data
    end

    def seed
      if @workflow_run_data[:workflow] == WorkflowRun::WORKFLOW[:consensus_genome]
        # Only add Sars-Cov-2 Consensus Genome Workflow Run for now.
        # TODO(omar): Add customizability later.
        find_or_create(:consensus_genome_workflow_run, **@workflow_run_data.merge(sars_cov_2_consensus_genome_attributes), sample: @sample, user: @sample.user)
      elsif @workflow_run_data[:workflow] == WorkflowRun::WORKFLOW[:amr]
        find_or_create(:amr_workflow_run, **@workflow_run_data.merge(amr_attributes), sample: @sample, user: @sample.user)
      end
    end

    private

    def sars_cov_2_consensus_genome_attributes
      {
        inputs_json: {
          "accession_id" => "MN908947.3",
          "accession_name" => "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
          "taxon_id" => 2_697_049,
          "taxon_name" => "Severe acute respiratory syndrome coronavirus 2",
          "technology" => "Illumina",
          "wetlab_protocol" => "varskip",
          "creation_source" => "SARS-CoV-2 Upload",
        }.to_json,
        cached_results: {
          "coverage_viz" => {
            "coverage_breadth" => 0.9530147476841788,
            "coverage_depth" => 13.519279002106812,
            "max_aligned_length" => 29_903,
            "total_length" => 29_903,
          },
          "quality_metrics" => {
            "mapped_reads" => 1347,
            "n_actg" => 7864,
            "n_ambiguous" => 0,
            "n_missing" => 22_039,
            "ref_snps" => 9,
            "total_reads" => 1793,
            "percent_identity" => 99.9,
            "gc_percent" => 39.0,
            "percent_genome_called" => 26.3,
            "reference_genome_length" => 29_903,
          },
          "taxon_info" => {
            "accession_id" => "MN908947.3",
            "accession_name" => "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome",
            "taxon_id" => 2_697_049,
            "taxon_name" => "Severe acute respiratory syndrome coronavirus 2",
          },
        }.to_json,
        wdl_version: "3.4.18",
      }
    end

    def amr_attributes
      {
        cached_results: {
          "quality_metrics" => {
            "total_reads" => 1122,
            "qc_percent" => 50.80213903743316,
            "adjusted_remaining_reads" => 334,
            "compression_ratio" => 1.0182926829268293,
            "total_ercc_reads" => 0,
            "fraction_subsampled" => 1.0,
            "insert_size_mean" => nil,
            "insert_size_standard_deviation" => nil,
            "percent_remaining" => 29.768270944741534,
          },
        }.to_json,
        inputs_json: {
          "accession_id" => nil,
          "accession_name" => nil,
          "taxon_id" => nil,
          "taxon_name" => nil,
          "technology" => "Illumina",
        }.to_json,
      }
    end
  end
end
