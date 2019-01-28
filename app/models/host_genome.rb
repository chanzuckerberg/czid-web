class HostGenome < ApplicationRecord
  has_many :samples
  has_and_belongs_to_many :metadata_fields

  def default_background
    Background.find(default_background_id) if default_background_id
  end
end
