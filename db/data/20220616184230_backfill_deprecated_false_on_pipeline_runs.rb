class BackfillDeprecatedFalseOnPipelineRuns < ActiveRecord::Migration[6.1]
  def up
    PipelineRun.where(deprecated: nil).update_all(deprecated: false)
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
