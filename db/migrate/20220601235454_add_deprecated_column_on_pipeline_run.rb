class AddDeprecatedColumnOnPipelineRun < ActiveRecord::Migration[6.1]
  def up
    add_column :pipeline_runs, :deprecated, :boolean, comment: "True/false if the pipeline run has been deprecated or not. Non deprecated pipeline runs are used in the normal flow of the web app."
    change_column_default :pipeline_runs, :deprecated, false
  end

  def down
    remove_column :pipeline_runs, :deprecated
  end
end
