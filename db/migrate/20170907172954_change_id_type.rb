class ChangeIdType < ActiveRecord::Migration[5.1]
  def change
    change_column :backgrounds_pipeline_outputs, :background_id, :bigint
    change_column :backgrounds_pipeline_outputs, :pipeline_output_id, :bigint
  end
end
