class AddAlertSentToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :alert_sent, :integer, default: 0
  end
end
