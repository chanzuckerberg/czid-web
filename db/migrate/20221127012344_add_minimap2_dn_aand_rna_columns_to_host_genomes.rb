class AddMinimap2DnAandRnaColumnsToHostGenomes < ActiveRecord::Migration[6.1]
  def change
    # this column is not used yet
    safety_assured { remove_column :host_genomes, :s3_minimap2_index_path }
    add_column :host_genomes, :s3_minimap2_dna_index_path, :string, comment: "The path to the index file to be used in the pipeline by minimap2 for host filtering DNA samples"
    add_column :host_genomes, :s3_minimap2_rna_index_path, :string, comment: "The path to the index file to be used in the pipeline by minimap2 for host filtering RNA samples"
  end
end
