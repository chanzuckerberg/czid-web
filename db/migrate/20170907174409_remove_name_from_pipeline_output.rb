class RemoveNameFromPipelineOutput < ActiveRecord::Migration[5.1]
  def change
    remove_column :pipeline_outputs, :name
  end
end
