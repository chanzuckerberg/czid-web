class AddRunStageLog < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_run_stages, :log_summary, :text
  end
end
