class RenameNewLocation < ActiveRecord::Migration[5.1]
  def up
    existing = MetadataField.find_by(name: "new_collection_location")
    if existing
      existing.update(name: "collection_location_v2", display_name: "Collection Location v2")
    end
    Metadatum.where(key: "new_collection_location").update_all(key: "collection_location_v2") # rubocop:disable SkipsModelValidations
  end

  def down
    existing = MetadataField.find_by(name: "collection_location_v2")
    if existing
      existing.update(name: "new_collection_location", display_name: "New Collection Location")
    end
    Metadatum.where(key: "collection_location_v2").update_all(key: "new_collection_location") # rubocop:disable SkipsModelValidations
  end
end
