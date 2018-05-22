class ChangeDefaultBackgroundIdToName < ActiveRecord::Migration[5.1]
  def change
    add_column :host_genomes, :default_background_name, :string
    HostGenome.all.each do |hg|
      hg.default_background_name = Background.find(hg.default_background_id).name
      hg.save
    end
    remove_column :host_genomes, :default_background_id
  end
end
