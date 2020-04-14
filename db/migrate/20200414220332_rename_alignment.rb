class RenameAlignment < ActiveRecord::Migration[5.1]
  def change
    ActiveRecord::Base.connection.execute("UPDATE pipeline_run_stages SET name='GSNAPL/RAPSEARCH alignment' WHERE name='GSNAPL/RAPSEARCH alignment'")
  end
end
