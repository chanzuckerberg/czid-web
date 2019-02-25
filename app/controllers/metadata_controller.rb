class MetadataController < ApplicationController
  include MetadataHelper

  # Token auth needed for CLI uploads
  skip_before_action :verify_authenticity_token, only: [:validate_csv_for_new_samples]
  before_action :authenticate_user!, except: [:validate_csv_for_new_samples]
  acts_as_token_authentication_handler_for User, only: [:validate_csv_for_new_samples], fallback: :devise
  current_power do # Needed for CLI
    Power.new(current_user)
  end

  def dictionary
  end

  def instructions
  end

  # TODO(mark): Factor this out into metadata_fields_controller, and add other CRUD endpoints.
  # All users get the same fields.
  def official_metadata_fields
    render json: official_metadata_fields_helper
  end

  def metadata_template_csv
    send_data metadata_template_csv_helper, filename: 'metadata_template.csv'
  end

  def validate_csv_for_new_samples
    metadata = params[:metadata]
    samples_data = params[:samples]

    # Create temporary samples for metadata validation.
    samples = samples_data.map do |sample|
      Sample.new(
        name: sample["name"],
        project: current_power.projects.find_by(id: sample["project_id"])
      )
    end

    issues = validate_metadata_csv_for_samples(samples, metadata, true)

    render json: {
      status: "success",
      issues: issues
    }
  rescue => err
    render json: {
      status: "error",
      # Wrapped for consistency with success response
      issues: { errors: [err] }
    }, status: :unprocessable_entity
  end
end
