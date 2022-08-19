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
  # The maximum number of objects (samples or workflow runs) that can be part of one bulk download.
  MAX_OBJECTS_BULK_DOWNLOAD = 'max_objects_bulk_download'.freeze
  # The maximum number of samples that can be part of an original input files bulk download.
  # Original input file downloads are significantly bigger and slower than other downloads, so a separate limit is needed.
  MAX_SAMPLES_BULK_DOWNLOAD_ORIGINAL_FILES = 'max_samples_bulk_download_original_files'.freeze
  # When this is "1", the announcement banner on the top of the site header will be enabled.
  # Other conditions may check a time constraint.
  SHOW_ANNOUNCEMENT_BANNER = 'show_announcement_banner'.freeze
  # When this is not "", the emergency announcement banner on the top of the site header will be enabled.
  # The emergency announcement banner with display the specified message.
  SHOW_EMERGENCY_BANNER_MESSAGE = 'show_emergency_banner_message'.freeze
  # The ARN of the mNGS pipeline's Step Function
  SFN_MNGS_ARN = 'sfn_mngs_arn'.freeze
  SFN_ARN = 'sfn_arn'.freeze
  # The pipeline version to use
  SFN_PIPELINE_VERSION = 'sfn_pipeline_version'.freeze
  # The ARN of a single stage pipeline's Step Function
  SFN_SINGLE_WDL_ARN = 'sfn_single_wdl_arn'.freeze
  SFN_CG_ARN = 'sfn_cg_arn'.freeze
  # When this is "1", the COVID-19 Public Site banner on the landing page will be shown.
  SHOW_LANDING_PUBLIC_SITE_BANNER = 'show_landing_public_site_banner'.freeze
  # Switch for additional ActiveRecord validations that were added en masse in Feb 2020.
  # Presence of the flag switches on the feature.
  ENABLE_MASS_VALIDATION = 'enable_mass_validation'.freeze
  # List of launched features still guarded by a flag.
  # Use the features rake tasks for editing this key
  LAUNCHED_FEATURES = 'launched_features'.freeze
  # The projects to apply the following two defaults to.
  # Stored as a JSON array of project_ids.
  # This is intended to be a temporary short-term mechanism to service critical projects with our partners.
  SUBSAMPLE_WHITELIST_PROJECT_IDS = 'subsample_whitelist_project_ids'.freeze
  # Default subsample for special biohub samples.
  SUBSAMPLE_WHITELIST_DEFAULT_SUBSAMPLE = 'subsample_whitelist_default_subsample'.freeze
  # Default max_input_fragments for special biohub samples.
  SUBSAMPLE_WHITELIST_DEFAULT_MAX_INPUT_FRAGMENTS = 'subsample_whitelist_default_max_input_fragments'.freeze
  # For controlling caching of report page
  DISABLE_REPORT_CACHING = 'disable_report_caching'.freeze
  # Set the size limit for files uploaded from S3, in gigabytes.
  S3_SAMPLE_UPLOAD_FILE_SIZE_LIMIT = 's3_sample_upload_file_size_limit'.freeze
  # Switch to enable view-only project snapshots that are visible to logged-out users.
  ENABLE_SNAPSHOT_SHARING = 'enable_snapshot_sharing'.freeze
  # Templates versions
  WORKFLOW_VERSION_TEMPLATE = "%<workflow_name>s-version".freeze
  # When enabled, we should use the new samples bucket for bulk downloads and the new task role name
  ENABLE_BULK_DOWNLOADS_V1 = "enable_bulk_downloads_v1".freeze
  # When this is "1", Pipeline Run status updates will be in HandleSfnNotifications instead of PipelineMonitor and ResultMonitor.
  ENABLE_SFN_NOTIFICATIONS = "enable_sfn_notifications".freeze
  # When this is "1", filtering by taxon will bypass ES and instead return a predefined set of 5 taxa. Mainly intended to be used by developers on M1 since ES is currently incompatible.
  BYPASS_ES_TAXON_SEARCH = "bypass_es_taxon_search".freeze
  # When this is "1", PipelineReportService will return the decimal type columns for rpm, percent_identity, and alignment_length (instead of the float type columns)
  PIPELINE_REPORT_SERVICE_USE_DECIMAL_TYPE_COLUMNS = "pipeline_report_service_use_decimal_type_columns".freeze

  after_save :clear_cached_record

  def clear_cached_record
    Rails.cache.delete("app_config-#{key}")
  end
end
