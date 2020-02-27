class AddSfnExecutionArnToPipelineRuns < ActiveRecord::Migration[5.1]
  def up
    add_column :pipeline_runs, :sfn_execution_arn, :string, null: true, description: "step function execution ARN for pipeline runs using pipeline_execution_strategy=step_function"
  end

  def down
    remove_column :pipeline_runs, :sfn_execution_arn
  end
end
