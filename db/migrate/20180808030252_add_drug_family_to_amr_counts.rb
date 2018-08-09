class AddDrugFamilyToAmrCounts < ActiveRecord::Migration[5.1]
  def change
    add_column :amr_counts, :drug_family, :string
  end
end
