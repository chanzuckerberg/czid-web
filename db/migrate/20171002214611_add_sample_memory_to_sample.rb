class AddSampleMemoryToSample < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :sample_memory, :int
  end
end
