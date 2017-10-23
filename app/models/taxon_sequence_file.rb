class TaxonSequenceFile < ApplicationRecord
  belongs_to :pipeline_output

  ANNOTATED_FASTA = 'taxid_annot.fasta'.freeze
  LOCAL_FASTA_PATH = '/app/tmp/results_fasta'.freeze

  def fasta_name
    "output#{pipeline_output_id}_taxid#{taxid}_hits.fasta"
  end

  def output_url
    "#{pipeline_output.sample.sample_output_folder_url}/#{fasta_name}"
  end

  def generate_fasta
    # works with species/genus/family-level taxids (ANNOTATED_FASTA has those and only those)
    s3_input_folder = pipeline_output.sample.sample_output_s3_path.to_s
    s3_input_fasta = "#{s3_input_folder}/#{ANNOTATED_FASTA}"
    local_fasta_path = LOCAL_FASTA_PATH.to_s
    local_input = "#{local_fasta_path}/#{ANNOTATED_FASTA}"
    local_output = "#{local_fasta_path}/#{fasta_name}"
    s3_output = "#{s3_input_folder}/#{fasta_name}"
    command = "mkdir -p #{local_fasta_path};"
    command += "aws s3 cp #{s3_input_fasta} #{local_fasta_path}/;"
    command += "grep -A 1 -E 'nr:#{taxid}:|nt:#{taxid}:' #{local_input} | sed '/^--$/d' > #{local_output};"
    command += "aws s3 cp #{local_output} #{s3_output};"
    _stdout, _stderr, status = Open3.capture3(command)
    return nil unless status.exitstatus.zero?
    output_url.to_s
  end
end
