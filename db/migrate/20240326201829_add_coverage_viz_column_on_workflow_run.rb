# Add a temporary column to store the coverage viz data for the workflow run
# Remove after data migration to NextGen
class AddCoverageVizColumnOnWorkflowRun < ActiveRecord::Migration[6.1]
  def change
    add_column :workflow_runs, :temp_cg_coverage_viz, :json, comment: "Temporary column to store coverage viz data for consensus-genome workflow runs"
  end
end
