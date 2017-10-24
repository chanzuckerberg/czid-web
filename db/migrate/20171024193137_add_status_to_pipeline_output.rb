class AddStatusToPipelineOutput < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_outputs, :status, :string
  end
end
