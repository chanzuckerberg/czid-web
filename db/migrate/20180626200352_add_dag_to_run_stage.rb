class AddDagToRunStage < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_run_stages, :dag_json, :text
  end
end
