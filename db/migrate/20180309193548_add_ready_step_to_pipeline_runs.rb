class AddReadyStepToPipelineRuns < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :ready_step, :integer
  end
end
