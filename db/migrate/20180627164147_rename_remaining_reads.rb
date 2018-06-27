class RenameRemainingReads < ActiveRecord::Migration[5.1]
  def change
    rename_column :pipeline_outputs, :remaining_reads, :adjusted_remaining_reads
    rename_column :pipeline_runs, :remaining_reads, :adjusted_remaining_reads
  end
end
