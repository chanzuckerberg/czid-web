class AddGtfIndexColumnOnHostGenomes < ActiveRecord::Migration[6.1]
  def change
    add_column :host_genomes, :s3_original_transcripts_gtf_index_path, :string, comment: "The path to the index file to be used in the pipeline by kallisto for host filtering. Used to generate host gene counts"
  end
end
