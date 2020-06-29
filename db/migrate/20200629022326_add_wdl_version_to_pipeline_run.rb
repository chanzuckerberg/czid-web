class AddWdlVersionToPipelineRun < ActiveRecord::Migration[5.2]
  def up
    add_column :pipeline_runs, :wdl_version, :string

    # At the time of this migration all wdl-1 is the only version used in prod
    # rubocop:disable Rails/SkipsModelValidations
    PipelineRun.where.not(sfn_execution_arn: nil).update_all(wdl_version: 1)
  end

  def down
    remove_column :pipeline_runs, :wdl_version
  end
end
