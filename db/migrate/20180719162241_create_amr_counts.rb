class CreateAmrCounts < ActiveRecord::Migration[5.1]
  def change
    create_table :amr_counts do |t|
      t.string :sample_id
      t.string :gene
      t.string :allele
      t.float :coverage
      t.float :depth

      t.timestamps
    end
  end
end
