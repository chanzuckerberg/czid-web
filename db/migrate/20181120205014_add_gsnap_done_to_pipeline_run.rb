class AddGsnapDoneToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :gsnap_done, :tinyint, default: 0
    add_column :pipeline_runs, :rapsearch_done, :tinyint, default: 0
  end
end
