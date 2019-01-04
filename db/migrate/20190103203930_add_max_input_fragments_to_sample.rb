class AddMaxInputFragmentsToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :max_input_fragments, :integer
    add_column :pipeline_runs, :max_input_fragments, :integer
  end
end
