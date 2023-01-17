class AddNewIndexColumnsOnHostGenomes < ActiveRecord::Migration[6.1]
  def change
    add_column :host_genomes, :s3_hisat2_index_path, :string, comment: "The path to the index file to be used in the pipeline by hisat2 for host filtering."
    add_column :host_genomes, :s3_kallisto_index_path, :string, comment: "The path to the index file to be used in the pipeline by kallisto for host filtering."
    # The bowtie2 index path was regenerated, given there were some updates to our index generation pipeline
    # This new column will be used to store the new index path so we can test it iteratively
    # With the end goal of replacing the old column (s3_bowtie2_index_path) with this new one.
    add_column :host_genomes, :s3_bowtie2_index_path_v2, :string, comment: "The path to the index file to be used in the pipeline by bowtie2 for host filtering."
  end
end
