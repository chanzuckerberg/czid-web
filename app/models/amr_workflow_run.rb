class AmrWorkflowRun < WorkflowRun
  # Model Notes:
  #
  # Where is the schema for this model?
  # * This inherits from WorkflowRun, following a Single Table Inheritance
  #   pattern. The hope is one generic WorkflowRun schema can cover many
  #   different workflow use-cases.
  #
  # Why do we have one main 'results' method?
  # * The idea is that the model should have one set of well-defined outputs
  #   that are consistently served, instead of having client pages compose
  #   different sets of results each time.
  OUTPUT_ZIP = "amr.ZipOutputs.output_zip".freeze

  # cacheable_only results will be stored in the db.
  # Full results will fetch from S3 (a superset of cached results).
  def results(*)
    # AmrWorkflowRuns do not store any results from S3 into the db.
    {}
  end

  def zip_link
    WorkflowRunZipService.call(self)
  rescue StandardError => exception
    LogUtil.log_error(
      "Error loading zip link",
      exception: exception,
      workflow_run_id: id
    )
    return nil
  end
end
