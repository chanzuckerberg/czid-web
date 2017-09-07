class Background < ApplicationRecord
  has_and_belongs_to_many :samples
  has_and_belongs_to_many :pipeline_outputs
  has_many :reports, dependent: :destroy
  validate :validate_size

  def validate_size
    errors.add(:base, "Need to select at least 2 pipeline runs.") if pipeline_outputs.size < 2
  end
end
