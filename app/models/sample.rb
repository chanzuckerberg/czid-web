class Sample < ApplicationRecord
  belongs_to :project
  has_many :pipeline_outputs, dependent: :destroy
end
