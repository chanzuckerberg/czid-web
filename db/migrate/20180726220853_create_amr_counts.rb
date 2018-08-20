class CreateAmrCounts < ActiveRecord::Migration[5.1]
  def change
    create_table :amr_counts do |t|
      t.string :gene
      t.string :allele
      t.float :coverage
      t.float :depth
      t.bigint :pipeline_run_id
      t.string :drug_family
      t.integer :level
      t.float :drug_gene_coverage
      t.float :drug_gene_depth
      t.timestamps
    end
    add_index :amr_counts, [:pipeline_run_id, :allele], unique: true
  end
end
