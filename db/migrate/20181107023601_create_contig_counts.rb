class CreateContigCounts < ActiveRecord::Migration[5.1]
  def change
    create_table :contig_counts do |t|
      t.bigint "pipeline_run_id"
      t.string "count_type"
      t.integer "taxid"
      t.integer "tax_level"
      t.string "contig_name"
      t.integer "count"
      t.index ["pipeline_run_id", "taxid", "count_type", "tax_level", "contig_name"], unique: true, name: 'contig_counts_pr_tax_contig'
      t.index ["pipeline_run_id", "taxid", "count"]
      t.index ["pipeline_run_id", "count"]
      t.timestamps
    end
  end
end
