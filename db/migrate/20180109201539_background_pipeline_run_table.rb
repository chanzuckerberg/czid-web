class BackgroundPipelineRunTable < ActiveRecord::Migration[5.1]
  def up
    create_table :backgrounds_pipeline_runs do |t|
      t.bigint :background_id
      t.bigint :pipeline_run_id
      t.index [:background_id, :pipeline_run_id], name: :index_bg_pr_id, unique: true
    end
    ActiveRecord::Base.connection.execute("
      INSERT INTO backgrounds_pipeline_runs(background_id, pipeline_run_id)
      SELECT background_id, pipeline_run_id
      FROM backgrounds_pipeline_outputs, pipeline_outputs
      WHERE pipeline_outputs.id = backgrounds_pipeline_outputs.pipeline_output_id
    ")
  end

  def down
    drop_table :backgrounds_pipeline_runs
  end
end
