class AddCtValueMetadataField < ActiveRecord::Migration[6.1]
  def up
    ct_value = MetadataField.create(
      name: "ct_value",
      display_name: "Ct Value",
      description: "The number of cycles required for the fluorescent signal to cross the background fluorescent threshold during qPCR. The value is inversely proportional to the amount of target nucleic acid.",
      base_type: MetadataField::NUMBER_TYPE,
      is_core: 1,
      is_default: 1,
      group: "Infection",
      host_genomes: HostGenome.all,
      examples: JSON.dump({ all: ["8", "14", "27"] })
    )

    ct_value.update(default_for_new_host_genome: 1)
    ct_value.projects = Project.all
  end

  def down
    MetadataField.find_by(name: "ct_value").destroy!
  end
end
