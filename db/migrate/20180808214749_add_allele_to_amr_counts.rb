class AddAlleleToAmrCounts < ActiveRecord::Migration[5.1]
  def change
    add_column :amr_counts, :allele, :string
    add_index :amr_counts, :allele, unique: true
  end
end
