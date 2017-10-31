class AddMemoryQueueToHostGenome < ActiveRecord::Migration[5.1]
  def change
    add_column :host_genomes, :sample_memory, :integer
    add_column :host_genomes, :job_queue, :string
  end
end
