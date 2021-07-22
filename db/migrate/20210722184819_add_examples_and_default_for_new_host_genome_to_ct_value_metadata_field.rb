class AddExamplesAndDefaultForNewHostGenomeToCtValueMetadataField < ActiveRecord::Migration[6.1]
  def up
    ct_value = MetadataField.find_by(name: "ct_value")
    ct_value.update(examples: JSON.dump({ all: ["8", "14", "27"] }))
    ct_value.update(default_for_new_host_genome: 1)
  end

  def down
    ct_value = MetadataField.find_by(name: "ct_value")
    ct_value.update(examples: nil)
    ct_value.update(default_for_new_host_genome: 0)
  end
end
