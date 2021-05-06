class AddOutputPrefixToPipelineRuns < ActiveRecord::Migration[5.2]
  def change
    add_column :pipeline_runs, :s3_output_prefix, :string, comment: "Record the SFN-WDL OutputPrefix used. Ex: 's3://bucket/samples/subpath/results' Never allow users to set this."
  end
end
