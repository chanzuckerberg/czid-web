class OutputState < ApplicationRecord
  belongs_to :pipeline_run

  # Current values of output are:
  # +----------------------+
  # | output               |
  # +----------------------+
  # | ercc_counts          |
  # | taxon_byteranges     |
  # | taxon_counts         |
  # | amr_counts           |
  # | refined_taxon_counts |
  # | contig_counts        |
  # | contigs              |
  # | input_validations    |
  # +----------------------+
  validates :output, presence: true, if: :mass_validation_enabled?

  # Current database values of state including legacy are:
  # +----------------+
  # | state          |
  # +----------------+
  # | CHECKED        |
  # | FAILED         |
  # | LOADED         |
  # | LOADING        |
  # | LOADING_ERROR  |
  # | LOADING_QUEUED |
  # | NULL           |
  # | RUNNING        |
  # | UNKNOWN        |
  # +----------------+
  #
  # Comment from pipeline_run.rb: The output_states indicate the state of each
  # target output, the progression being as follows:
  #   UNKNOWN -> LOADING_QUEUED -> LOADING -> LOADED / FAILED
  validates :state, inclusion: { in: [
    PipelineRun::STATUS_FAILED,
    PipelineRun::STATUS_LOADED,
    PipelineRun::STATUS_LOADING,
    PipelineRun::STATUS_LOADING_ERROR,
    PipelineRun::STATUS_LOADING_QUEUED,
    PipelineRun::STATUS_UNKNOWN,
  ], }, if: :mass_validation_enabled?
end
