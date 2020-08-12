class CopyToWorkflowRuns < ActiveRecord::Migration[5.2]
  def up
    v0_samples = Sample.where(temp_pipeline_workflow: WorkflowRun::WORKFLOW[:consensus_genome])
    v0_samples.each do |sample|
      WorkflowRun.create(
        sample_id: sample.id,
        status: sample.temp_sfn_execution_status,
        workflow: sample.temp_pipeline_workflow,
        wdl_version: sample.temp_wdl_version,
        sfn_execution_arn: sample.temp_sfn_execution_arn,
        executed_at: sample.created_at
      )
    end
  end

  def down
    v0_samples = Sample.where(temp_pipeline_workflow: WorkflowRun::WORKFLOW[:consensus_genome])
    v0_samples.each do |sample|
      sample.workflow_runs.delete_all
    end
  end
end
