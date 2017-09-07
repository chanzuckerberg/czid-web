class CreateBackgroundsPipelineOutputs < ActiveRecord::Migration[5.1]
  def change
    create_table :backgrounds_pipeline_outputs do |t|
      t.integer :background_id
      t.integer :pipeline_output_id 
    end
  end
end
