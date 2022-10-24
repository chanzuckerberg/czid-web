# frozen_string_literal: true

class BackfillTechnologyOnPipelineRuns < ActiveRecord::Migration[6.1]
  disable_ddl_transaction!

  def up
    PipelineRun.unscoped.in_batches do |pr|
      pr.update_all technology: "Illumina"
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
