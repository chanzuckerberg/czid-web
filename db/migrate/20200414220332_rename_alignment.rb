class RenameAlignment < ActiveRecord::Migration[5.1]
  def change
    PipelineRunStage.where(name: "GSNAPL/RAPSEARCH alignment").find_each { |u| u.update(name: "GSNAPL/RAPSEARCH2 alignment") }
  end
end
