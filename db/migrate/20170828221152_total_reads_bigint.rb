class TotalReadsBigint < ActiveRecord::Migration[5.1]
  def change
    change_column :pipeline_outputs, :total_reads, :bigint
    change_column :pipeline_outputs, :remaining_reads, :bigint
  end
end
