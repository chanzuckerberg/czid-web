
class BulkDownloadsController < ApplicationController
  include BulkDownloadTypesHelper

  # GET /bulk_downloads/types
  def types
    render json: BulkDownloadTypesHelper::BULK_DOWNLOAD_TYPES
  end
end
