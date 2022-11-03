class AddMinimapIndexPathToHostGenomes < ActiveRecord::Migration[6.1]
  def change
    add_column :host_genomes, :s3_minimap2_index_path, :string, comment: "The path to the index file to be used in the pipeline by minimap2 for host filtering."
  end
end
