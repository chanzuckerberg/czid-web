# See SeedMetadataFields. This migration changes water control to be required.
# NOTE: we should probably be using seeds.rb instead of migrations for initializing data.
class UpdateWaterControlMetadataField < ActiveRecord::Migration[5.1]
  def up
    water_control = MetadataField.find_by(name: "water_control")
    if water_control
      water_control.update(is_required: 1)
    end
  end

  def down
    water_control = MetadataField.find_by(name: "water_control")
    if water_control
      water_control.update(is_required: 0)
    end
  end
end
