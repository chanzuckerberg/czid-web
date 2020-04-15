# This is needed to load the constants in PipelineRunStage
require 'pipeline_run_stage'

class RenameAlignment < ActiveRecord::Migration[5.1]
  def change
    PipelineRunStage.where(name: "GSNAPL/RAPSEARCH alignment").find_each { |u| u.update(name: "GSNAPL/RAPSEARCH2 alignment") }
  end
end
