class HostGenome < ApplicationRecord
  has_many :samples

  NO_HOST_NAME = 'No host subtraction'.freeze

  def default_background
    Background.find_by(name: default_background_name) if default_background_name
  end
end
