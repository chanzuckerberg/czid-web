# All Ruby/backend analytics events should be added here (since 2021-02-26).
# - Use SQL-friendly names for consistency.
# - See also auto named events in ApplicationRecord#log_analytics. Put new events here that are not covered by auto events.
# - See also MetricUtil.log_analytics_event. The current_user details should be provided in most cases.
class EventDictionary
  # A Pipeline Run (of a Sample) succeeded processing.
  #  @param pipeline_run_id ID of the pipeline run.
  #  @param project_id ID of the project
  #  @param run_time Approximate running time in seconds.
  PIPELINE_RUN_SUCCEEDED = "PIPELINE_RUN_SUCCEEDED".freeze

  # A Pipeline Run (of a Sample) failed processing.
  #  @param pipeline_run_id ID of the pipeline run.
  #  @param project_id ID of the project
  #  @param run_time Approximate running time in seconds.
  PIPELINE_RUN_FAILED = "PIPELINE_RUN_FAILED".freeze

  # A User used the location search autocomplete feature.
  #  @param query The string the user typed.
  LOCATION_GEOSEARCHED = "LOCATION_GEOSEARCHED".freeze

  # A User submitted the interest "sign up" form on the public landing page.
  #  @param firstName First name
  #  @param lastName Last name
  #  @param email Email address
  #  @param institution Institution submitted
  #  @param usage What they wrote for intended usage
  USER_INTEREST_FORM_SUBMITTED = "USER_INTEREST_FORM_SUBMITTED".freeze

  # A User loaded the sample report page. This is a duplicate backend event to compare w/ frontend tracking frequency. This should duplicate PIPELINE_SAMPLE_REPORT_SAMPLE_VIEWED.
  #  @param sample_id The sample ID.
  SAMPLES_CONTROLLER_SAMPLE_VIEWED = "SAMPLES_CONTROLLER_SAMPLE_VIEWED".freeze

  # Machine-event: The pipeline report for a newly processed sample was precached with a default background model.
  PIPELINE_REPORT_PRECACHED = "PIPELINE_REPORT_PRECACHED".freeze

  # A user has initiated a sample via the bulk_upload_with_metadata endpoint.
  #  @param version The version of the client the user is bulk uploading from, 'web' if web client
  #  @param client The client the user is bulk uploading from 'CLI' or 'web'
  #  @param sample_id The ID of the uploaded sample
  SAMPLE_UPLOAD_STARTED = "SAMPLE_UPLOAD_STARTED".freeze

  # A sample upload has finished successfully
  #  @param sample_id The ID of the uploaded sample
  SAMPLE_UPLOAD_SUCCEEDED = "SAMPLE_UPLOAD_SUCCEEDED".freeze

  # A user has requested that their pipeline/workflow run be
  # deleted and we marked it as soft-deleted. Log for GDPR compliance
  # @param user_email: The email of the user who initiated the deletion
  # @param deleted_objects: Information about the runs being deleted
  # @param workflow: The workflow the user requested be deleted (e.g. short read mNGS, AMR)
  GDPR_RUN_SOFT_DELETED = "GDPR_RUN_SOFT_DELETED".freeze

  # A user has requested that their pipeline/workflow run be
  # deleted and we marked hard deleted it from mySQL. Log for GDPR compliance
  # @param user_email: The email of the user who initiated the deletion
  # @param deleted_objects: Information about the runs being deleted
  # @param workflow: The workflow the user requested be deleted (e.g. short read mNGS, AMR)
  GDPR_RUN_HARD_DELETED = "GDPR_RUN_HARD_DELETED".freeze

  # We deleted a sample because there were no more active runs after the user
  # deleted pipeline/workflow runs. Log for GDPR compliance
  # @param user_email: The email of the user who initiated the deletion
  # @param deleted_samples: Information about the samples being deleted
  GDPR_SAMPLE_HARD_DELETED = "GDPR_SAMPLE_HARD_DELETED".freeze
end
