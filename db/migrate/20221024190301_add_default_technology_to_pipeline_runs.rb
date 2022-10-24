class AddDefaultTechnologyToPipelineRuns < ActiveRecord::Migration[6.1]
  def change
    change_column_default :pipeline_runs, :technology, from: nil, to: "Illumina"
  end
end
