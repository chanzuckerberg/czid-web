class MetadataController < ApplicationController
  include MetadataHelper

  def dictionary
  end

  # All users get the same fields.
  def official_metadata_fields
    render json: official_metadata_fields_helper
  end

  def metadata_template_csv
    send_data metadata_template_csv_helper, filename: 'metadata_template.csv'
  end
end
