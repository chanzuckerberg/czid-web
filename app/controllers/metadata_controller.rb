class MetadataController < ApplicationController
  include MetadataHelper

  # Token auth needed for CLI uploads
  TOKEN_AUTH_METHODS = [:validate_csv_for_new_samples].freeze
  skip_before_action :verify_authenticity_token, only: TOKEN_AUTH_METHODS
  prepend_before_action :token_based_login_support, only: TOKEN_AUTH_METHODS

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
    # The project to pull metadata_fields and existing samples (if applicable) from.
    project_id = params[:project_id]
    # The names of new samples that are being created.
    new_sample_names = params[:new_sample_names]
    send_data metadata_template_csv_helper(project_id, new_sample_names), filename: 'metadata_template.csv'
  end

  def validate_csv_for_new_samples
    metadata = params[:metadata]
    samples_data = params[:samples]

    projects = current_power.updatable_projects
                            .where(id: samples_data.map { |sample| sample["project_id"] }.uniq)
                            .includes(:metadata_fields).to_a

    # Create temporary samples for metadata validation.
    samples = samples_data.map do |sample|
      Sample.new(
        name: sample["name"],
        project: projects.select { |project| project.id == sample["project_id"] }.first
      )
    end

    issues = validate_metadata_csv_for_samples(
      samples,
      metadata,
      true,
      current_user && current_user.admin?
    )
    # TODO: (gdingle): remove admin only after launch. See https://jira.czi.team/browse/IDSEQ-2051.

    render json: {
      status: "success",
      issues: issues,
    }
  rescue => err
    render json: {
      status: "error",
      # Wrapped for consistency with success response
      issues: { errors: [err] },
    }, status: :unprocessable_entity
  end
end
