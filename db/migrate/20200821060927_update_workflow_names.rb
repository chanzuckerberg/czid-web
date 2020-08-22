class UpdateWorkflowNames < ActiveRecord::Migration[5.2]
  def change
    change_column_default :samples, :temp_pipeline_workflow, from: "main", to: "short-read-mngs"

    # rubocop:disable Rails/SkipsModelValidations
    reversible do |dir|
      dir.up do
        Sample.where(temp_pipeline_workflow: "consensus_genome").update_all(temp_pipeline_workflow: "consensus-genome")
        Sample.where(temp_pipeline_workflow: "main").update_all(temp_pipeline_workflow: "short-read-mngs")
        WorkflowRun.where(workflow: "consensus_genome").update_all(workflow: "consensus-genome")
      end

      dir.down do
        Sample.where(temp_pipeline_workflow: "consensus-genome").update_all(temp_pipeline_workflow: "consensus_genome")
        Sample.where(temp_pipeline_workflow: "short-read-mngs").update_all(temp_pipeline_workflow: "main")
        WorkflowRun.where(workflow: "consensus-genome").update_all(workflow: "consensus_genome")
      end
    end
  end
end
