class AddUseStepFunctionPipelineToSamples < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :use_step_function_pipeline, :boolean, null: false, default: false, comment: "If true, sample will use the new step function pipeline for pipeline runs."
  end
end
