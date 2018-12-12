class RemoveSampleMemoryFromHostGenomes < ActiveRecord::Migration[5.1]
  def change
    remove_column :host_genomes, :sample_memory, :int
  end
end
