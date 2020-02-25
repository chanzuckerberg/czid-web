class AppConfig < ApplicationRecord
  # When this is "1", all requests other than the landing page will be re-directed to the maintenance page.
  DISABLE_SITE_FOR_MAINTENANCE = 'disable_site_for_maintenance'.freeze
  # When this is "1", the Video Tour banner on the landing page will be shown.
  SHOW_LANDING_VIDEO_BANNER = 'show_landing_video_banner'.freeze
  # JSON array containing the number of the stages allowed to auto restart. Ex: [1, 3]
  AUTO_RESTART_ALLOWED_STAGES = 'auto_restart_allowed_stages'.freeze
  # The ECR image to use for the s3 tar writer service. Defaults to "idseq-s3-tar-writer:latest"
  S3_TAR_WRITER_SERVICE_ECR_IMAGE = 's3_tar_writer_service_ecr_image'.freeze
  # When this is "1", new users will also be created in the Auth0 database.
  # Enable when Auth0 rolls out.
  USE_AUTH0_FOR_NEW_USERS = 'use_auth0_for_new_users'.freeze
  # The maximum number of samples that can be part of one bulk download.
  MAX_SAMPLES_BULK_DOWNLOAD = 'max_samples_bulk_download'.freeze
  # The maximum number of samples that can be part of an original input files bulk download.
  # Original input file downloads are significantly bigger and slower than other downloads, so a separate limit is needed.
  MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES = 'max_samples_bulk_download_original_files'.freeze
  # When this is "1", the announcement banner on the top of the site header will be enabled.
  # Other conditions may check a time constraint.
  SHOW_ANNOUNCEMENT_BANNER = 'show_announcement_banner'.freeze
  # The default selected options for report page on public ncov site, in JSON format.
  PUBLIC_NCOV_REPORT_PAGE_SELECTED_OPTIONS = 'public_ncov_report_page_selected_options'.freeze
  # The ID of the public ncov project
  PUBLIC_NCOV_PROJECT_ID = 'public_ncov_project_id'.freeze
  # The ID of the public ncov heatmap
  PUBLIC_NCOV_HEATMAP_ID = 'public_ncov_heatmap_id'.freeze
  # The following urls are linked in the public site About page
  PUBLIC_INDEX_CASE_URL = 'public_index_case_url'.freeze
  PUBLIC_INDEX_CASE_URL_WITH_COVERAGE_VIZ = 'public_index_case_url_with_coverage_viz'.freeze
  PUBLIC_INDEX_CASE_URL_WITH_OLD_PIPELINE = 'public_index_case_url_with_old_pipeline'.freeze
  PUBLIC_INDEX_CASE_URL_RESEQUENCED = 'public_index_case_url_resequenced'.freeze
  PUBLIC_INDEX_CASE_URL_ENRICHED = 'public_index_case_url_enriched'.freeze
  PUBLIC_FAMILY_1_URL = 'public_family_1_url'.freeze
  PUBLIC_FAMILY_2_URL = 'public_family_2_url'.freeze
  PUBLIC_FAMILY_3_URL = 'public_family_3_url'.freeze
  # Control for public preview.
  PUBLIC_PREVIEW_USER = 'public_preview_user'.freeze
  PUBLIC_PREVIEW_KEY = 'public_preview_key'.freeze
end
