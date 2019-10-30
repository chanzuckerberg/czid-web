class AppConfig < ApplicationRecord
  # When this is "1", all requests other than the landing page will be re-directed to the maintenance page.
  DISABLE_SITE_FOR_MAINTENANCE = 'disable_site_for_maintenance'.freeze
  # When this is "1", the Video Tour banner on the landing page will be shown.
  SHOW_LANDING_VIDEO_BANNER = 'show_landing_video_banner'.freeze
  # JSON array containing the number of the stages allowed to auto restart. Ex: [1, 3]
  AUTO_RESTART_ALLOWED_STAGES = 'auto_restart_allowed_stages'.freeze
  # The ECR image to use for the s3 tar writer service. Defaults to "idseq-s3-tar-writer:latest"
  S3_TAR_WRITER_SERVICE_ECR_IMAGE = 's3_tar_writer_service_ecr_image'.freeze
end
