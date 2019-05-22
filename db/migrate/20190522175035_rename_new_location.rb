class RenameNewLocation < ActiveRecord::Migration[5.1]
  def up
    existing = MetadataField.find_by(name: "new_collection_location")
    if existing
      existing.update(name: "collection_location_v2", display_name: "Collection Location v2")
    end
  end

  def down
    existing = MetadataField.find_by(name: "collection_location_v2")
    if existing
      existing.update(name: "new_collection_location", display_name: "New Collection Location")
    end
  end
end
