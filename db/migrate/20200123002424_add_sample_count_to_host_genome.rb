class AddSampleCountToHostGenome < ActiveRecord::Migration[5.1]
  def up
    add_column :host_genomes, :samples_count, :integer, default: 0, null: false, comment: 'Added to enable ranking of host genomes by popularity'

    HostGenome.find_each do |hg|
      HostGenome.reset_counters(hg.id, :samples)
    end
  end
end
