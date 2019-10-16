class BulkDownload < ApplicationRecord
  has_and_belongs_to_many :pipeline_runs
  belongs_to :user

  STATUS_WAITING = "waiting".freeze
  STATUS_RUNNING = "running".freeze
  STATUS_ERROR = "error".freeze
  STATUS_SUCCESS = "success".freeze

  before_save :convert_params_to_json

  attr_accessor :params

  validates :status, presence: true, inclusion: { in: [STATUS_WAITING, STATUS_RUNNING, STATUS_ERROR, STATUS_SUCCESS] }

  def convert_params_to_json
    # We need the params in object form during validation.
    # Convert params to JSON right before saving.
    if params
      self.params_json = params.to_json
    end
  end

  # Only bulk downloads created by the user
  def self.viewable(user)
    user.bulk_downloads
  end
end
