class AddUnmappedReadsToPipelineOutput < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_outputs, :unmapped_reads, :bigint
  end
end
