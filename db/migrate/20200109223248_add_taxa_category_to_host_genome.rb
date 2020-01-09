class AddTaxaCategoryToHostGenome < ActiveRecord::Migration[5.1]
  def change
    add_column :host_genomes, "taxa_category", :string, comment: "An informal taxa name for grouping hosts. First implemented for sample type suggestions."
    update_existing!
  end

  def update_existing!
    HostGenome.find_by(name: "Human").update!(taxa_category: "human")

    HostGenome.find_by(name: "Mosquito").update!(taxa_category: "insect")
    HostGenome.find_by(name: "Tick").update!(taxa_category: "insect")
    HostGenome.find_by(name: "Bee").update!(taxa_category: "insect")
  end
end
