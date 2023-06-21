class ChangeMappedReadsToBigInt < ActiveRecord::Migration[6.1]
  def change
    safety_assured { change_column :pipeline_runs, :mapped_reads, :bigint }
  end
end
