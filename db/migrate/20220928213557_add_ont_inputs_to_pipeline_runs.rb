class AddOntInputsToPipelineRuns < ActiveRecord::Migration[6.1]
  def change
    add_column :pipeline_runs, :technology, :string, comment: "Name of the technology used, e.g. illumina or ont."
    add_column :pipeline_runs, :guppy_basecaller_setting, :string, null: true, comment: "User-specified input used by ont pipeline runs. Null for illumina pipeline runs."
  end
end
