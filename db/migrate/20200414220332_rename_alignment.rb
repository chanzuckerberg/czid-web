class RenameAlignment < ActiveRecord::Migration[5.1]
  # Using raw sql here because PipelineRunStage introduces dependencies on constants that may not be initialized
  def up
    ActiveRecord::Base.connection.execute("UPDATE pipeline_run_stages SET name='GSNAPL/RAPSEARCH alignment' WHERE name='GSNAPL/RAPSEARCH2 alignment'")
  end

  def down
    ActiveRecord::Base.connection.execute("UPDATE pipeline_run_stages SET name='GSNAPL/RAPSEARCH2 alignment' WHERE name='GSNAPL/RAPSEARCH alignment'")
  end
end
