class PipelineRun < ApplicationRecord
  belongs_to :sample
  has_one :pipeline_output
  OUTPUT_JSON_NAME = 'idseq_web_sample.json'.freeze
  LOCAL_JSON_PATH = '/app/tmp/results_json'

  def local_json_path
    "#{LOCAL_JSON_PATH}/#{id}"
  end
  def load_results_from_s3
    return if self.pipeline_output
    output_json_s3_path = "#{sample.sample_output_s3_path}/#{OUTPUT_JSON_NAME}"
    # Get the file
    downloaded_json_path = download_file(output_json_s3_path)
    return unless downloaded_json_path
    json_dict = JSON.parse(File.read(downloaded_json_path))
    pipeline_output_dict = json_dict['pipeline_output']
    pipeline_output_dict.slice!('name', 'total_reads',
                                'remaining_reads', 'taxon_counts_attributes')
    po = PipelineOutput.new(pipeline_output_dict)
    po.sample = sample
    po.pipeline_run = self
    po.save
    self.pipeline_output_id = po.id
    self.save
    # rm the json
    _stdout, _stderr, _status = Open3.capture3("rm -f #{downloaded_json_path}")
  end

  def download_file(s3_path)
    command = IdSeqPipeline::BASE_COMMAND
    command += "mkdir -p #{local_json_path};"
    command += "aws s3 cp #{s3_path} #{local_json_path}/;"
    _stdout, _stderr, status = Open3.capture3(command)
    return nil unless status.exitstatus.zero?
    "#{local_json_path}/#{File.basename(s3_path)}"
  end

end
