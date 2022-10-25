class UpdatePipelineRunTechnology < ActiveRecord::Migration[6.1]
  # Note: Currently, there are no read/write operations on this column.
  def change
    add_index :pipeline_runs, :technology
    change_column_null :pipeline_runs, :technology, false
  end
end
