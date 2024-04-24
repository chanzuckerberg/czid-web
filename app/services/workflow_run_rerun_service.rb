# Rerun workflow in Nextgen and Rails
class WorkflowRunRerunService
  include Callable

  def initialize(user_id, ng_workflow_run_id)
    @user_id = user_id
    @ng_workflow_run_id = ng_workflow_run_id
    @token = TokenCreationService
             .call(
               user_id: @user_id,
               should_include_project_claims: true,
               service_identity: "rails"
             )["token"]
  end

  def call
    response = CzidGraphqlFederation
               .query_with_token(
                 @user_id,
                 GraphqlOperations::GetWorkflowRunForRerun,
                 variables: {
                   workflow_run_id: @ng_workflow_run_id,
                 },
                 token: @token
               )
    workflow_run = response.data&.workflow_runs&.first
    if workflow_run.nil?
      raise "Nextgen workflow run not found"
    end

    # TODO: Refactor SampleEntityCreationService so that it can be reused here
    # so that we can avoid duplicating constructing workflow run inputs
    # and introducing inconsistencies.
    rails_workflow_run_id = workflow_run.rails_workflow_run_id
    raw_inputs = workflow_run.raw_inputs_json
    collection_id = workflow_run.collection_id
    entity_inputs = workflow_run.entity_inputs.edges.map(&:node).map do |entity_input|
      {
        name: entity_input.field_name,
        entityId: entity_input.input_entity_id,
        entityType: entity_input.entity_type,
      }
    end
    # owner id may be different from workflow runner
    owner_id = workflow_run.owner_user_id

    # TODO: after dual writes, remove rerunning Rails workflow run
    # railsWorkflowRunId is a required field right now on the create mutation
    rails_workflow_run = WorkflowRun.find(rails_workflow_run_id)
    new_rails_workflow_run = rails_workflow_run.rerun

    # Get the workflow version id
    wdl_version = VersionRetrievalService.call(rails_workflow_run.sample.project_id, rails_workflow_run.workflow)
    response = CzidGraphqlFederation
               .query_with_token(
                 @user_id,
                 GraphqlOperations::GetWorkflowVersion,
                 variables: {
                   workflow_name: rails_workflow_run.workflow,
                   version: wdl_version,
                 },
                 token: @token
               )
    workflow_version_id = response.data&.workflow_versions&.first&.id

    # Create a new workflow run
    owner_token = TokenCreationService
                  .call(
                    user_id: owner_id,
                    should_include_project_claims: true,
                    service_identity: "rails"
                  )["token"]
    response = CzidGraphqlFederation
               .query_with_token(
                 owner_id,
                 GraphqlOperations::CreateWorkflowRun,
                 variables: {
                   collectionId: collection_id,
                   workflowVersionId: workflow_version_id,
                   rawInputJson: raw_inputs,
                   railsWorkflowRunId: new_rails_workflow_run.id,
                   entityInputs: entity_inputs,
                 },
                 token: owner_token
               )
    new_workflow_run_id = response.data&.create_workflow_run&.id

    if new_workflow_run_id.nil?
      raise "Failed to create new workflow run"
    end

    # Deprecate the old workflow run
    deprecate_response = CzidGraphqlFederation.query_with_token(
      owner_id,
      GraphqlOperations::DeprecateWorkflowRun,
      variables: {
        old_workflow_run_id: @ng_workflow_run_id,
        new_workflow_run_id: new_workflow_run_id,
      },
      token: owner_token
    )

    if deprecate_response.data&.update_workflow_run&.first&.id.nil?
      raise "Failed to deprecate old workflow run"
    end

    # Rerun the workflow run in Nextgen
    # TODO: after dual writes, remove passing in SFN ARN
    kickoff_response = CzidGraphqlFederation
                       .query_with_token(
                         owner_id,
                         GraphqlOperations::KickoffWorkflowRun,
                         variables: {
                           workflow_run_id: new_workflow_run_id,
                           execution_id: new_rails_workflow_run.sfn_execution_arn,
                         },
                         token: owner_token
                       )
    if kickoff_response.data&.run_workflow_run&.id.nil?
      raise "Failed to kickoff new workflow run"
    end

    new_workflow_run_id
  end
end
