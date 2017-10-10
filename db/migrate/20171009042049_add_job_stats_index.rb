class AddJobStatsIndex < ActiveRecord::Migration[5.1]
  def change
    add_index :job_stats, :task
  end
end
