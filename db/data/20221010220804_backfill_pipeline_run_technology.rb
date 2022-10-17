# frozen_string_literal: true

class BackfillPipelineRunTechnology < ActiveRecord::Migration[6.1]
  disable_ddl_transaction!

  def up
    PipelineRun.all.each do |pr|
      pr.update(technology: "Illumina") 
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
