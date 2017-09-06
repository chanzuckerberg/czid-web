class AddNameToPipelineOutput < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_outputs, :name, :string
  end
end
