class HostGenome < ApplicationRecord
  has_many :samples
  has_and_belongs_to_many :metadata_fields

  def default_background
    Background.find(default_background_id) if default_background_id
  end

  def metadata_types
    metadata_fields.map do |field|
      {
        key: field.name,
        dataType: Metadatum.convert_type_to_string(field.base_type),
        name: field.display_name,
        options: field.options && JSON.parse(field.options),
        group: field.group
      }
    end
  end
end
