class AddTaxaCategoryToHostGenome < ActiveRecord::Migration[5.1]
  def change
    add_column :host_genomes, "taxa_category", :string, comment: "An informal taxa name for grouping hosts. First implemented for sample type suggestions."
    # Note: test database does not have a "Human" host at this time
    update_existing!(["Human"], "human")
    update_existing!(["Mosquito", "Tick", "Bee"], "insect")
  end

  def update_existing!(names, value)
    HostGenome.where(name: names).find_each { |u| u.update(taxa_category: value) }
  end
end
