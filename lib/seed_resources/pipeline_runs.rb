require 'factory_bot'
require_relative 'seed_resource'

module SeedResource
  class PipelineRuns < Base
    # Models associated with a PipelineRun:
    # Taxon Counts -> Taxon Lineage
    # Job Stats
    # Output States
    # ERCC Counts
    # Insert Size Metrics Set
    # PipelineRunStages
    # Taxon ByteRanges
    # AMR Counts
    # Accession Coverage Stats

    def initialize(sample, pipeline_runs_data)
      @sample = sample
      @pipeline_runs_data = pipeline_runs_data
    end

    def seed
      seed_taxon_lineages
      pipeline_run_attributes = {}.tap do |h|
        h[:technology] = @pipeline_runs_data[:technology] || PipelineRun::TECHNOLOGY_INPUT[:illumina]
        h[:job_status] = @pipeline_runs_data[:job_status] || PipelineRun::STATUS_CHECKED
        h[:sfn_execution_arn] = @pipeline_runs_data[:sfn_execution_arn] || "fake_sfn_execution_arn"
        h[:pipeline_execution_strategy] = @pipeline_runs_data[:pipeline_execution_strategy] || "step_function"
        h[:job_status] = @pipeline_runs_data[:job_status] || PipelineRun::STATUS_CHECKED
        h[:pipeline_version] = @pipeline_runs_data[:pipeline_version] || "8.2"
        h[:wdl_version] = @pipeline_runs_data[:wdl_version] || "8.2.1"
        h[:finalized] = @pipeline_runs_data[:finalized] || 1
        h[:results_finalized] = @pipeline_runs_data[:results_finalized] || 10
        h[:total_reads] = @pipeline_runs_data[:total_reads] || 8_845_238
        h[:total_bases] = @pipeline_runs_data[:total_bases] || nil
        h[:adjusted_remaining_reads] = @pipeline_runs_data[:adjusted_remaining_reads] || 20_014
        h[:total_ercc_reads] = @pipeline_runs_data[:total_ercc_reads] || 128
        h[:unmapped_reads] = @pipeline_runs_data[:unmapped_reads] || 4020
        h[:subsample] = @pipeline_runs_data[:subsample] || 1_000_000
        h[:pipeline_branch] = @pipeline_runs_data[:pipeline_branch] || "master"
        h[:total_ercc_reads] = @pipeline_runs_data[:total_ercc_reads] || 128
        h[:qc_percent] = @pipeline_runs_data[:qc_percent] || 87.94
        h[:compression_ratio] = @pipeline_runs_data[:compression_ratio] || 1.03378
        h[:deprecated] = @pipeline_runs_data[:deprecated] || false
        h[:time_to_finalized] = @pipeline_runs_data[:time_to_finalized] || 1223
        h[:time_to_results_finalized] = @pipeline_runs_data[:time_to_results_finalized] || 1226

        if h[:technology] == PipelineRun::TECHNOLOGY_INPUT[:nanopore]
          h[:taxon_counts_data] = taxon_counts_data
          h[:contigs_data] = contigs_data
        elsif h[:technology] == PipelineRun::TECHNOLOGY_INPUT[:illumina]
          h[:taxon_counts_data] = taxon_counts_data.map { |data| data.except(:nt_base, :nr_base, :rpm) }
          h[:contigs_data] = contigs_data.map { |data| data.except(:base_count) }
        end
      end

      pr = find_or_create(:pipeline_run, sample: @sample, **pipeline_run_attributes)

      if pr
        seed_job_stats_data(pr)
        seed_output_states(pr)
      end
    end

    private

    def seed_taxon_lineages
      find_or_create(:taxon_lineage, tax_name: "Klebsiella pneumoniae", taxid: 573, genus_taxid: 570, superkingdom_taxid: 2)
      find_or_create(:taxon_lineage, tax_name: "Klebsiella", taxid: 570, genus_taxid: 570, superkingdom_taxid: 2)
    end

    def taxon_counts_data
      [{
        tax_level: 1,
        taxon_name: "Klebsiella pneumoniae",
        nt: 209,
        nt_base: 500_000,
        percent_identity: 99.6995,
        alignment_length: 1149.402,
        e_value: -89.5641,
        bpm: 445_632,
      }, {
        tax_level: 1,
        taxon_name: "Klebsiella pneumoniae",
        nr: 69,
        nr_base: 370_000,
        percent_identity: 97.8565,
        alignment_length: 460.3623,
        e_value: -16.9101,
        bpm: 329_768,
      }, {
        tax_level: 2,
        nt: 217,
        nt_base: 550_000,
        taxon_name: "Klebsiella",
        percent_identity: 99.7014,
        alignment_length: 1490.424,
        e_value: -89.5822,
        bpm: 490_196,
      }, {
        tax_level: 2,
        nr: 87,
        nr_base: 400_000,
        taxon_name: "Klebsiella",
        percent_identity: 97.9598,
        alignment_length: 460.4253,
        e_value: -16.9874,
        bpm: 356_506,
      },]
    end

    def contigs_data
      [{
        species_taxid_nt: 573,
        species_taxid_nr: 573,
        genus_taxid_nt: 570,
        genus_taxid_nr: 570,
        read_count: 99,
        base_count: 300_000,
      }, {
        species_taxid_nt: 573,
        species_taxid_nr: 573,
        genus_taxid_nt: 570,
        genus_taxid_nr: 570,
        read_count: 99,
        base_count: 300_000,
      }, {
        species_taxid_nt: 570,
        species_taxid_nr: 570,
        genus_taxid_nt: 570,
        genus_taxid_nr: 570,
        read_count: 99,
        base_count: 300_000,
      }, {
        species_taxid_nt: 570,
        species_taxid_nr: 570,
        genus_taxid_nt: 570,
        genus_taxid_nr: 570,
        read_count: 99,
        base_count: 300_000,
      },]
    end

    def seed_job_stats_data(pr)
      reads_after_tasks = {
        unidentified_fasta: 4146,
        bowtie2_ercc_filtered_out: 8_845_110,
        bowtie2_host_filtered_out: 20_662,
        czid_dedup_out: 19_360,
        fastp_out: 7_778_390,
        fastqs: 8_845_238,
        hisat2_host_filtered_out: 20_014,
        subsampled_out: 20_014,
        validate_input_out: 8_845_238,
        fastp_low_quality_reads: 8_627_646,
        fastp_too_short_reads: 8_464_322,
        fastp_low_complexity_reads: 777_839,
      }

      reads_after_tasks.each do |task, reads_after|
        find_or_create(:job_stat, task: task, reads_after: reads_after, bases_after: reads_after, pipeline_run: pr)
      end
    end

    def seed_output_states(pr)
      output_states_data = [
        { output: "accession_coverage_stats", state: "LOADED" },
        { output: "amr_counts", state: "LOADED" },
        { output: "contig_counts", state: "LOADED" },
        { output: "ercc_counts", state: "LOADED" },
        { output: "insert_size_metrics", state: "LOADED" },
        { output: "taxon_byteranges", state: "LOADED" },
        { output: "taxon_counts", state: "LOADED" },
      ]

      output_states_data.each { |output_state| find_or_create(:output_state, output_state.merge(pipeline_run: pr)) }
    end
  end
end
