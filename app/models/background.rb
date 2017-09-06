class Background < ApplicationRecord
  has_and_belongs_to_many :samples
  has_many :reports, dependent: :destroy
end
