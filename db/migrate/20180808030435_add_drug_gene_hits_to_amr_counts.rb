class AddDrugGeneHitsToAmrCounts < ActiveRecord::Migration[5.1]
  def change
    add_column :amr_counts, :drug_gene_hits, :integer
  end
end
