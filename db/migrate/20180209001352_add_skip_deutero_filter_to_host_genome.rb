class AddSkipDeuteroFilterToHostGenome < ActiveRecord::Migration[5.1]
  def change
    add_column :host_genomes, :skip_deutero_filter, :integer
  end
end
