class CreateAmrCounts < ActiveRecord::Migration[5.1]
  def change
    create_table :amr_counts do |t|
      t.string :gene
      t.string :allele
      t.float :coverage
      t.float :depth
      t.bigint :pipeline_run_id

      t.timestamps
    end
  end
end
