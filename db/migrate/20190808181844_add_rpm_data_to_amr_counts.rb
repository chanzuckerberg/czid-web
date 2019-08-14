class AddRpmDataToAmrCounts < ActiveRecord::Migration[5.1]
  def change
    add_column :amr_counts, :annotation_gene, :string
    add_column :amr_counts, :genbank_accession, :string
    add_column :amr_counts, :total_reads, :integer
    add_column :amr_counts, :rpm, :float
    add_column :amr_counts, :dpm, :float
  end
end
