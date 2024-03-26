class BulkDeletionServiceNextgen
  include Callable
  # ------------------------------------------------------------------------
  # Queries
  # ------------------------------------------------------------------------

  # Get workflow run info for bulk deletion & for bulk deletion validation
  GetWorkflowRuns = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($run_ids: [UUID!]!) {
      workflowRuns (where: {
        id: { _in: $run_ids }
        status: { _nin: [PENDING, STARTED, RUNNING] }
        deletedAt: { _is_null: true }
      }) {
        id
        ownerUserId
        railsWorkflowRunId
      }

      # Also fetch sample IDs for each workflow run
      workflowRunEntityInputs (where: {
        workflowRun: { id: { _in: $run_ids } }
        entityType: { _eq: "sample" }
      }) {
        workflowRun {
          id
        }
        inputEntityId
      }
    }
  GRAPHQL

  GetWorkflowRunsBySampleId = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($sample_ids: [UUID!]!) {
      workflowRuns (where: {
        deprecatedById: {
          _is_null: true
        }
        entityInputs: {
          inputEntityId: {
            _in: $sample_ids
          }
        }
        deletedAt: {
          _is_null: true
        }
      }) {
        id
        entityInputs(where: {
          entityType: {
            _eq: "sample"
          }
        }) {
          edges {
            node {
              inputEntityId
            }
          }
        }
      }    
    }
  GRAPHQL

  GetWorkflowRunsBySampleIdAndWorkflowType = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($sample_ids: [UUID!]!, $workflow_name: String) {
      workflowRuns (where: {
        deprecatedById: {
          _is_null: true
        }
        entityInputs: {
          inputEntityId: {
            _in: $sample_ids
          }
        }
        workflowVersion: {
          workflow: {
            name: {
              _eq: $workflow_name
            }
          }
        }
        deletedAt: {
          _is_null: true
        }
      }) {
        id
        entityInputs(where: {
          entityType: {
            _eq: "sample"
          }
        }) {
          edges {
            node {
              inputEntityId
            }
          }
        }
      }    
    }
  GRAPHQL

  # Get sample info for bulk deletion validation
  GetSamples = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($sample_ids: [UUID!]!) {
      samples (where: {
        id: { _in: $sample_ids }
        deletedAt: { _is_null: true }
      }) {
        id
        railsSampleId
        name
      }
    }
  GRAPHQL

  GetSamplesByRailsSampleId = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query ($sample_ids: [Int!]!) {
      samples (where: {
        railsSampleId: { _in: $sample_ids }
        deletedAt: { _is_null: true }
      }) {
        id
        railsSampleId
      }
    }
  GRAPHQL

  # Get workflow run info for bulk deletion using Rails IDs as input
  GetWorkflowRunsInts = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query($run_ids: [Int!]) {
      workflowRuns (where: {
        railsWorkflowRunId: { _in: $run_ids }
        deletedAt: { _is_null: true }
        entityInputs: {
          entityType: {
            _eq: "sample"
          }   
        }
      }) {
        id
      }
    }
  GRAPHQL

  GetCGsToDelete = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query($run_ids: [UUID!]) {
      consensusGenomes(where: {
        producingRunId: { _in: $run_ids }
        deletedAt: { _is_null: true }
      }) {
        id
        producingRunId
        sequencingRead {
          sample {
            id
            railsSampleId
          }
        }
      }
    }
  GRAPHQL

  GetBulkDownloadWorkflowRunsForEntities = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query($entity_ids: [UUID!]) {
      workflowRuns(where: {
        deletedAt: { _is_null: true }
        entityInputs: {
          inputEntityId: { _in: $entity_ids }
        }
        workflowVersion: {
          workflow: {
            name: {
              _eq: "bulk-download"
            }
          }
        }
      }) {
        id
      }
    }
  GRAPHQL

  GetBulkDownloadsForWorkflowRuns = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    query($run_ids: [UUID!]) {
      bulkDownloads(where: {
        deletedAt: { _is_null: true }
        producingRunId: { _in: $run_ids }
      }) {
        id
        producingRunId
      }
    }
  GRAPHQL

  UpdateWorkflowRuns = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($run_ids: [UUID!], $delete_timestamp: DateTime!) {
      updateWorkflowRun(
        where: {
          id: { _in: $run_ids }
        }
        input: {
          deletedAt: $delete_timestamp
        }
      ) {
        id
        deletedAt
      }
    }
  GRAPHQL

  UpdateConsensusGenomes = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($cg_ids: [UUID!], $delete_timestamp: DateTime!) {
      updateConsensusGenome(
        where: {
          id: { _in: $cg_ids }
        }
        input: {
          deletedAt: $delete_timestamp
        }
      ) {
        id
        deletedAt
      }
    }
  GRAPHQL

  UpdateSamples = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($sample_ids: [UUID!], $delete_timestamp: DateTime!) {
      updateSample(
        where: {
          id: { _in: $sample_ids }
        }
        input: {
          deletedAt: $delete_timestamp
        }
      ) {
        id
        deletedAt
      }
    }
  GRAPHQL

  UpdateBulkDownload = CzidGraphqlFederation::Client.parse <<-'GRAPHQL'
    mutation($bulk_download_ids: [UUID!], $delete_timestamp: DateTime!) {
      updateBulkDownload(
        where: {
          id: { _in: $bulk_download_ids }
        }
        input: {
          deletedAt: $delete_timestamp
        }
      ) {
        id
        deletedAt
      }
    }
  GRAPHQL

  # ------------------------------------------------------------------------
  # Main Service to perform bulk deletion
  # ------------------------------------------------------------------------
  def initialize(user:, object_ids:, workflow:, delete_timestamp:, token:)
    @user = user
    @object_ids = object_ids
    @workflow = workflow
    @delete_timestamp = delete_timestamp
    @token = token
  end

  def call
    user = @user
    workflow = @workflow
    object_ids = @object_ids
    delete_timestamp = @delete_timestamp.iso8601 # NextGen expects timestamps in ISO8601 format
    token = @token || TokenCreationService.call(user_id: user.id, should_include_project_claims: true, service_identity: "rails")["token"]

    # The source of truth of which runs are done under which Samples is a combination of Rails and NextGen.
    # NextGen is the source of truth for all CG runs, even those initially run on Rails and migrated.
    # Rails is the source of truth for all other non-CG runs (short-read mNGS, long-read mNGS, AMR).
    # Below we're building up that source of truth.

    # Deploy stages:
    # 1. Write to Rails + NextGen, read from Rails      object_ids = array of integers (still need to query NextGen so that duplicate CGs are deleted in NextGen too)
    # 2. Write to Rails + NextGen, read from NextGen    object_ids = array of UUIDs
    # 3. Write to NextGen, read from NextGen            object_ids = array of UUIDs

    # ------------------------------------------------------------------------
    # First, fetch all NextGen CG WorkflowRuns using UUIDs and INTs
    # ------------------------------------------------------------------------
    is_nextgen_ids = BulkDeletionServiceNextgen.nextgen_workflow?(workflow, object_ids)
    rails_workflow_run_ids = []
    rails_sample_ids = []

    # If object_ids are Rails IDs, do the extra step of getting the NextGen IDs
    if !is_nextgen_ids
      nextgen_workflows = CzidGraphqlFederation.query_with_token(
        user.id,
        GetWorkflowRunsInts,
        variables: { run_ids: object_ids },
        token: token
      ).data.workflow_runs
      nextgen_run_ids_to_delete = nextgen_workflows.map(&:id)
      rails_workflow_run_ids += object_ids
      sample_ids = Power.new(user).deletable_workflow_runs.where(id: object_ids).by_workflow(workflow).non_deprecated.pluck(:sample_id)
      rails_sample_ids += sample_ids

      # Return if no data in NextGen -- nothing left to do
      # This shouldn't happen after dual writes are on
      if nextgen_run_ids_to_delete.empty?
        return {
          rails_ids: {
            workflow_run_ids: rails_workflow_run_ids,
            sample_ids: rails_sample_ids,
          },
          nextgen_ids: {},
        }
      end
    else
      nextgen_run_ids_to_delete = object_ids
    end

    # TODO: see if we can do fewer requests
    # TODO: somehow find runs deprecated by these runs so we can delete them too
    # Fetch NextGen workflow runs to delete and their entity inputs to get the corresponding sample ids
    nextgen_workflows_to_delete_response = CzidGraphqlFederation.query_with_token(
      user.id,
      GetWorkflowRuns,
      variables: {
        run_ids: nextgen_run_ids_to_delete,
      },
      token: token
    ).data

    # The workflow runs themselves
    nextgen_workflows_to_delete = nextgen_workflows_to_delete_response.workflow_runs

    # Use the entity inputs to get workflow run id -> sample id
    nextgen_workflows_to_sample_ids = nextgen_workflows_to_delete_response.workflow_run_entity_inputs
    nextgen_sample_ids = nextgen_workflows_to_sample_ids.map(&:input_entity_id).uniq

    # Fetch NextGen samples -- needed to get Rails sample id
    nextgen_samples = CzidGraphqlFederation.query_with_token(
      user.id,
      GetSamples,
      variables: {
        sample_ids: nextgen_sample_ids,
      },
      token: token
    ).data.samples

    # Fetch all NextGen workflow runs on the samples
    all_workflow_runs_nextgen = CzidGraphqlFederation.query_with_token(user.id, GetWorkflowRunsBySampleId, variables: { sample_ids: nextgen_sample_ids }, token: token).data.workflow_runs

    # Fetch CGs associated with the workflow runs to delete
    cgs_to_delete = CzidGraphqlFederation.query_with_token(user.id, GetCGsToDelete, variables: { run_ids: nextgen_run_ids_to_delete }, token: token).data.consensus_genomes
    cg_ids_to_delete = cgs_to_delete.map(&:id)

    # Figure out which samples don't have any more workflow runs (and should therefore be deleted)
    sample_ids_to_delete = find_samples_to_delete(nextgen_workflows_to_sample_ids, all_workflow_runs_nextgen, nextgen_sample_ids)
    samples_to_delete = nextgen_samples.select { |sample| sample_ids_to_delete.include?(sample.id) }

    # Soft delete bulk downloads
    bulk_download_wrs, bulk_download_entities = soft_delete_bulk_downloads(user, cg_ids_to_delete, token, delete_timestamp).values_at(:bulk_download_workflow_runs, :bulk_download_entities)

    # Create CG deletion logs
    create_deletion_logs(
      user,
      cgs_to_delete,
      samples_to_delete,
      nextgen_workflows_to_delete,
      bulk_download_wrs,
      bulk_download_entities,
      WorkflowRun::WORKFLOW[:consensus_genome],
      delete_timestamp
    )

    # Soft delete CGs, samples, and workflow runs in NextGen
    soft_delete_objects(user, token, delete_timestamp, cg_ids_to_delete, sample_ids_to_delete, nextgen_run_ids_to_delete)

    # Get Rails workflow run ids and sample ids for the Rails deletion service to use
    rails_workflow_run_ids += nextgen_workflows_to_delete.map(&:rails_workflow_run_id).compact
    rails_sample_ids += nextgen_samples.map(&:rails_sample_id).compact

    return {
      rails_ids: {
        workflow_run_ids: rails_workflow_run_ids.uniq,
        sample_ids: rails_sample_ids.uniq, # all sample ids -- Rails will figure out which to delete
      },
      nextgen_ids: {
        cg_ids: cg_ids_to_delete,
        sample_ids: sample_ids_to_delete, # sample ids to delete in nextgen
        workflow_run_ids: nextgen_run_ids_to_delete,
        bulk_download_workflow_run_ids: bulk_download_wrs.map(&:id),
        bulk_download_entity_ids: bulk_download_entities.map(&:id),
      },
    }
  end

  # Perform logic of figuring out samples should be deleted in nextgen
  def find_samples_to_delete(nextgen_workflows_to_sample_ids, all_workflow_runs_nextgen, sample_ids)
    # Construct groups by sample

    # Get groups of workflow runs to delete for each sample
    # groups_to_delete = {
    #   "Sample_UUID1" => [
    #     WR_UUID1,
    #     WR_UUID2
    #   ]
    # }
    groups_to_delete = {}
    nextgen_workflows_to_sample_ids.each do |wr_entity_input|
      groups_to_delete[wr_entity_input.input_entity_id] ||= []
      groups_to_delete[wr_entity_input.input_entity_id] << wr_entity_input.workflow_run.id
    end

    # get group of samples to all workflow runs
    # groups_all = {
    #   "Sample_UUID1" => [
    #     WR_UUID1,
    #     WR_UUID2,
    #     WR_UUID3
    #   ]
    # }
    groups_all = {}
    all_workflow_runs_nextgen.map do |wr|
      sample_id = wr.entity_inputs.edges.first.node.input_entity_id
      groups_all[sample_id] ||= []
      groups_all[sample_id] << wr.id
    end

    sample_ids_to_delete = []
    sample_ids.each do |sample_id|
      # If no other workflows are linked to this Sample in NextGen, delete it in NextGen
      if (groups_all[sample_id] - groups_to_delete[sample_id]).empty?
        sample_ids_to_delete << sample_id
      end
    end

    return sample_ids_to_delete
  end

  def soft_delete_bulk_downloads(user, entity_ids, token, delete_timestamp)
    bulk_download_workflow_runs = CzidGraphqlFederation.query_with_token(user.id, GetBulkDownloadWorkflowRunsForEntities, variables: { entity_ids: entity_ids }, token: token).data.workflow_runs
    bd_wr_ids = bulk_download_workflow_runs.map(&:id)
    bulk_download_entities = CzidGraphqlFederation.query_with_token(user.id, GetBulkDownloadsForWorkflowRuns, variables: { run_ids: bd_wr_ids }, token: token).data.bulk_downloads

    CzidGraphqlFederation.query_with_token(user.id, UpdateBulkDownload, variables: { bulk_download_ids: bulk_download_entities.map(&:id), delete_timestamp: delete_timestamp }, token: token)
    CzidGraphqlFederation.query_with_token(user.id, UpdateWorkflowRuns, variables: { run_ids: bd_wr_ids, delete_timestamp: delete_timestamp }, token: token)

    return {
      bulk_download_workflow_runs: bulk_download_workflow_runs,
      bulk_download_entities: bulk_download_entities,
    }
  end

  # TODO: in the future this should be more general. We shouldn't need to specify consensus genomes here
  def soft_delete_objects(user, token, delete_timestamp, cg_ids_to_delete, sample_ids_to_delete, workflow_run_ids_to_delete)
    CzidGraphqlFederation.query_with_token(user.id, UpdateWorkflowRuns, variables: { run_ids: workflow_run_ids_to_delete, delete_timestamp: delete_timestamp }, token: token)
    CzidGraphqlFederation.query_with_token(user.id, UpdateConsensusGenomes, variables: { cg_ids: cg_ids_to_delete, delete_timestamp: delete_timestamp }, token: token)
    CzidGraphqlFederation.query_with_token(user.id, UpdateSamples, variables: { sample_ids: sample_ids_to_delete, delete_timestamp: delete_timestamp }, token: token)
  end

  def create_deletion_logs(
    user,
    cgs_to_delete,
    samples_to_delete,
    workflow_runs_to_delete,
    bulk_download_wrs,
    bulk_download_entities,
    workflow,
    delete_timestamp
  )
    cgs_to_delete.each do |cg|
      NextgenDeletionLog.create!(
        user_id: user.id,
        user_email: user.email,
        object_id: cg.id,
        object_type: "ConsensusGenome",
        soft_deleted_at: delete_timestamp,
        rails_object_id: nil,
        metadata_json: {
          producing_run_id: cg.producing_run_id,
          sample_id: cg.sequencing_read.sample.id,
        }
      )
    end

    samples_to_delete.each do |sample|
      NextgenDeletionLog.create!(
        user_id: user.id,
        user_email: user.email,
        object_id: sample.id,
        object_type: Sample.name,
        soft_deleted_at: delete_timestamp,
        rails_object_id: sample.rails_sample_id,
        metadata_json: {}
      )
    end

    workflow_runs_to_delete.each do |wr|
      NextgenDeletionLog.create!(
        user_id: user.id,
        user_email: user.email,
        object_id: wr.id,
        object_type: WorkflowRun.name,
        soft_deleted_at: delete_timestamp,
        rails_object_id: wr.rails_workflow_run_id,
        metadata_json: {
          workflow: workflow,
        }
      )
    end

    bulk_download_wrs.each do |wr|
      NextgenDeletionLog.create!(
        user_id: user.id,
        user_email: user.email,
        object_id: wr.id,
        object_type: WorkflowRun.name,
        soft_deleted_at: delete_timestamp,
        rails_object_id: nil,
        metadata_json: {
          workflow: "bulk-download",
        }
      )
    end

    bulk_download_entities.each do |bd|
      NextgenDeletionLog.create!(
        user_id: user.id,
        user_email: user.email,
        object_id: bd.id,
        object_type: BulkDownload.name,
        soft_deleted_at: delete_timestamp,
        rails_object_id: nil,
        metadata_json: {
          producing_run_id: bd.producing_run_id,
        }
      )
    end
  end

  # ------------------------------------------------------------------------
  # Class Methods
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

  def self.get_invalid_workflows(user_id, run_ids)
    result = CzidGraphqlFederation.query_with_token(user_id, GetWorkflowRuns, variables: { run_ids: run_ids })
    valid_ids = result.data.workflow_runs.select { |run| run.owner_user_id == user_id }.map(&:id)
    invalid_ids = run_ids.reject { |id| valid_ids.include?(id) }
    invalid_sample_ids = result.data.workflow_run_entity_inputs.filter { |input| invalid_ids.include?(input.workflow_run.id) }.map(&:input_entity_id)

    {
      valid_ids: valid_ids,
      invalid_sample_ids: invalid_sample_ids,
    }
  end

  def self.get_rails_samples_with_nextgen_workflow(user_id, rails_sample_ids, workflow, token = nil)
    token ||= TokenCreationService.call(user_id: user_id, should_include_project_claims: true, service_identity: "rails")["token"]

    rails_samples_with_workflow = []
    samples = CzidGraphqlFederation.query_with_token(user_id, GetSamplesByRailsSampleId, variables: { sample_ids: rails_sample_ids }, token: token).data.samples
    workflow_runs = CzidGraphqlFederation.query_with_token(user_id, GetWorkflowRunsBySampleIdAndWorkflowType, variables: { sample_ids: samples.map(&:id), workflow_name: workflow }, token: token).data.workflow_runs
    samples.each do |sample|
      sample_has_workflow = workflow_runs.any? { |wr| wr.entity_inputs.edges.first.node.input_entity_id == sample.id }
      if sample_has_workflow
        rails_samples_with_workflow << sample.rails_sample_id
      end
    end
    return rails_samples_with_workflow
  end
end
