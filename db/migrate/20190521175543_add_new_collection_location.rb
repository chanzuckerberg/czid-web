class AddNewCollectionLocation < ActiveRecord::Migration[5.1]
  # Data migration to add new intelligent collection location MetadataField

  def up
    existing = MetadataField.find_by(name: "new_collection_location")
    unless existing
      field = MetadataField.create(name: "new_collection_location", display_name: "New Collection Location", description: "Location sample was originally collected", base_type: 3, group: "Sample", host_genomes: HostGenome.all)
      proj = Project.find_by(name: "CI")
      if proj
        proj.metadata_fields << field
      end
    end
  end

  def down
    field = MetadataField.find_by(name: "new_collection_location")
    field.destroy
  end
end
