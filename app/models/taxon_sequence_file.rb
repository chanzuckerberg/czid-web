class TaxonSequenceFile < ApplicationRecord
  belongs_to :pipeline_output

  ANNOTATED_FASTA = 'taxid_annot.fasta'.freeze
  LOCAL_FASTA_PATH = '/app/tmp/results_fasta'.freeze

  def fasta_name
    "output#{pipeline_output_id}_taxid#{taxid}_hits.fasta"
  end

  def generate_fasta
    # currently only works with species-level taxids (ANNOTATED_FASTA is species-level)
    input_fasta_s3_path = "#{pipeline_output.sample.sample_output_s3_path}/#{ANNOTATED_FASTA}"
    local_fasta_path = "#{LOCAL_FASTA_PATH}"
    local_input = "#{local_fasta_path}/#{ANNOTATED_FASTA}"
    local_output = "#{local_fasta_path}/#{fasta_name}"
    command = "mkdir -p #{local_fasta_path};"
    command += "aws s3 cp #{input_fasta_s3_path} #{local_fasta_path}/;"
    command += "grep -A 1 -E 'nr:#{taxid}:|nt:#{taxid}:' #{local_input} | sed '/^--$/d' > #{local_output}"
    _stdout, _stderr, status = Open3.capture3(command)
    return nil unless status.exitstatus.zero?
    "#{local_output}"
  end
end
