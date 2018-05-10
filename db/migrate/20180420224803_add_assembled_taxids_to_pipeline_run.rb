class AddAssembledTaxidsToPipelineRun < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_runs, :assembled_taxids, :text
  end
end
