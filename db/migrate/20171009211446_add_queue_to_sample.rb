class AddQueueToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :job_queue, :string
  end
end
