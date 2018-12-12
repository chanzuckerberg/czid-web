class RemoveSampleMemoryFromSamples < ActiveRecord::Migration[5.1]
  def change
    remove_column :samples, :sample_memory, :int
    remove_column :samples, :job_queue, :string
  end
end
