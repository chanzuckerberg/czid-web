class AddCommandFuncsToRunStages < ActiveRecord::Migration[5.1]
  def change
    add_column :pipeline_run_stages, :job_command_func, :string
    add_column :pipeline_run_stages, :load_db_command_func, :string
  end
end
