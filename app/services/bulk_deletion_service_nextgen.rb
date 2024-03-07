class BulkDeletionServiceNextgen
  # ------------------------------------------------------------------------
  # Queries
  # ------------------------------------------------------------------------

  # Get workflow run info for bulk deletion & for bulk deletion validation
  GetWorkflowRuns = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($workflow_run_ids: [UUID!]!) {
      workflowRuns (where: {
        id: { _in: $workflow_run_ids }
      }) {
        id
        ownerUserId
        railsWorkflowRunId
      }

      # Also fetch sample IDs for each workflow run
      workflowRunEntityInputs (where: {
        workflowRun: { id: { _in: $workflow_run_ids } }
        entityType: { _eq: "sample" }
      }) {
        workflowRun {
          id
        }
        inputEntityId
      }
    }
  GRAPHQL

  # Get sample info for bulk deletion validation
  GetSamples = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($sample_ids: [UUID!]!) {
      samples (where: {
        id: { _in: $sample_ids }
      }) {
        id
        railsSampleId
        name
      }
    }
  GRAPHQL

  # ------------------------------------------------------------------------
  # Utility functions
  # ------------------------------------------------------------------------

  # Check if workflow and IDs are from NextGen
  def self.nextgen_workflow?(workflow, workflow_run_ids)
    workflow == WorkflowRun::WORKFLOW[:consensus_genome] && !ArrayUtil.all_integers?(workflow_run_ids)
  end

  def self.get_invalid_samples(user_id, sample_ids)
    invalid_sample_names = []
    invalid_sample_ids_rails = []

    samples = CzidGraphqlFederation.query_with_token(user_id, GetSamples, variables: { sample_ids: sample_ids }).data.samples
    samples.each do |sample|
      # Use NextGen Sample IDs if railsSampleId is nil. This is because if a NextGen sample points
      # to a Rails sample, Rails is the source of truth for that sample's name.
      if sample.rails_sample_id.nil?
        invalid_sample_names << sample.name
      else
        invalid_sample_ids_rails << sample.rails_sample_id
      end
    end

    {
      invalid_sample_names: invalid_sample_names,
      invalid_sample_ids_rails: invalid_sample_ids_rails,
    }
  end

  def self.get_invalid_workflows(user_id, workflow_run_ids)
    result = CzidGraphqlFederation.query_with_token(user_id, GetWorkflowRuns, variables: { workflow_run_ids: workflow_run_ids })
    valid_ids = result.data.workflow_runs.select { |run| run.owner_user_id == user_id }.map(&:id)
    invalid_ids = workflow_run_ids.reject { |id| valid_ids.include?(id) }
    invalid_sample_ids = result.data.workflow_run_entity_inputs.filter { |input| invalid_ids.include?(input.workflow_run.id) }.map(&:input_entity_id)

    {
      valid_ids: valid_ids,
      invalid_sample_ids: invalid_sample_ids,
    }
  end
end
