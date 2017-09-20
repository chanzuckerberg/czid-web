class PipelineRun < ApplicationRecord
  belongs_to :sample
  has_one :pipeline_output
  OUTPUT_JSON_NAME = 'idseq_web_sample.json'.freeze

  def load_results_from_s3
    output_json_path = "#{sample.sample_output_s3_path}/#{OUTPUT_JSON_NAME}"
  end

end
