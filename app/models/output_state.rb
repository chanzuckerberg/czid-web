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

  validates :state, inclusion: { in: [
    PipelineRun::STATUS_LOADED,
    PipelineRun::STATUS_UNKNOWN,
    PipelineRun::STATUS_LOADING,
    PipelineRun::STATUS_LOADING_QUEUED,
    PipelineRun::STATUS_LOADING_ERROR,
  ], }, if: :mass_validation_enabled?
end
