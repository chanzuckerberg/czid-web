class AddWdlToPipelineRunStages < ActiveRecord::Migration[5.2]
  def change
    add_column :pipeline_run_stages, :wdl, :string
  end
end
