class AddDagVarsToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :dag_vars, :text
    add_column :pipeline_runs, :dag_vars, :text
  end
end
