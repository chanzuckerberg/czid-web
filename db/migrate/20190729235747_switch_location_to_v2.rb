class SwitchLocationToV2 < ActiveRecord::Migration[5.1]
  def up
    mf = MetadataField.find_by(name: "collection_location")
    if mf
      mf.update(is_core: 0, is_default: 0, is_required: 0, default_for_new_host_genome: 0, display_name: "Collection Location v1")
    end

    mf = MetadataField.where(name: "collection_location_v2")
    if mf
      mf.update(is_core: 1, is_default: 1, is_required: 1, default_for_new_host_genome: 1, display_name: "Collection Location")
    end
  end

  def down
    mf = MetadataField.find_by(name: "collection_location")
    if mf
      mf.update(is_core: 1, is_default: 1, is_required: 1, default_for_new_host_genome: 1, display_name: "Collection Location")
    end

    mf = MetadataField.where(name: "collection_location_v2")
    if mf
      mf.update(is_core: 0, is_default: 0, is_required: 0, default_for_new_host_genome: 0, display_name: "Collection Location v2")
    end
  end
end
