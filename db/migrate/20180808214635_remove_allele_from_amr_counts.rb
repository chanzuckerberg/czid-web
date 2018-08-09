class RemoveAlleleFromAmrCounts < ActiveRecord::Migration[5.1]
  def change
    remove_column :amr_counts, :allele, :string
  end
end
