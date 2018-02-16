class RemoveJobQueueFromHostGenomes < ActiveRecord::Migration[5.1]
  def change
    remove_column :host_genomes, :job_queue, :string
  end
end
