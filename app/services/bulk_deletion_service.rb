# This service performs the immediate actions necessary for bulk
# deletion of pipeline or workflow runs, then kicks off an async job
# to hard delete the runs.
# It accepts deletable workflow run ids or sample ids as object_ids argument, user,
# and workflow. It returns an array of deleted pipeline run or workflow run ids and
# an array of deleted sample ids.
class BulkDeletionService
  include Callable
  HARD_DELETION_BATCH_SIZE = 10

  def initialize(object_ids:, user:, workflow:)
    if object_ids.blank?
      Rails.logger.warn("BulkDeletionService called with object_ids = nil")
      @object_ids = []
    else
      # Expect to get either array of integers (read from Rails) or array of UUID strings (read from NextGen).
      # Only convert to integers if we receive Rails IDs, not UUIDs.
      @object_ids = if ArrayUtil.all_integers?(object_ids)
                      object_ids.map(&:to_i)
                    else
                      object_ids
                    end
    end

    if workflow.nil?
      raise DeletionValidationService::WorkflowMissingError
    end

    @user = user
    @workflow = workflow
  end

  def call
    error = nil
    deleted_run_ids = []
    deleted_sample_ids = []

    begin
      deleted_objects = bulk_delete_objects(object_ids: @object_ids, workflow: @workflow, user: @user)
    rescue StandardError => e
      LogUtil.log_error(
        "BulkDeletionEvent: Unexpected issue handling bulk deletion of objects: #{e}",
        exception: e,
        object_ids: @object_ids,
        workflow: @workflow,
        user_id: @user.id
      )
      error = "Bulk Deletion Error: #{e}"
    end

    if error.nil?
      deleted_run_ids = deleted_objects[:deleted_run_ids]
      deleted_sample_ids = deleted_objects[:deleted_sample_ids]
    end

    return {
      deleted_run_ids: deleted_run_ids,
      deleted_sample_ids: deleted_sample_ids,
      error: error,
    }
  end

  private

  def bulk_delete_objects(object_ids:, workflow:, user:)
    current_power = Power.new(user)
    delete_timestamp = Time.now.utc

    # If mngs, get pipeline runs from sample ids and clean up visualizations.
    # If workflow runs, get workflow run objects from workflow run ids.
    nextgen_ids = {}
    token = TokenCreationService
            .call(
              user_id: user.id,
              should_include_project_claims: true,
              service_identity: "rails"
            )["token"]
    if WorkflowRun::MNGS_WORKFLOWS.include?(workflow)
      technology = WorkflowRun::MNGS_WORKFLOW_TO_TECHNOLOGY[workflow]
      deletable_rails_objects = current_power.deletable_pipeline_runs.where(sample_id: object_ids, technology: technology)
      sample_ids = object_ids
      handle_visualizations(sample_ids, delete_timestamp)
    elsif workflow != WorkflowRun::WORKFLOW[:consensus_genome]
      deletable_rails_objects = current_power.deletable_workflow_runs.where(id: object_ids).by_workflow(workflow).non_deprecated
      sample_ids = deletable_rails_objects.pluck(:sample_id)
    else
      # NEXTGEN: get Rails objects to delete and NextGen objects to delete
      rails_ids, nextgen_ids = BulkDeletionServiceNextgen.call(
        user: user,
        object_ids: object_ids,
        workflow: workflow,
        delete_timestamp: delete_timestamp,
        token: token
      ).values_at(:rails_ids, :nextgen_ids)
      deletable_rails_ids, sample_ids = rails_ids.values_at(:workflow_run_ids, :sample_ids)
      deletable_rails_objects = current_power.deletable_workflow_runs.where(id: deletable_rails_ids).by_workflow(workflow).non_deprecated
    end

    # Soft delete Rails bulk downloads
    handle_bulk_downloads(deletable_rails_objects, delete_timestamp)

    # Skip validations so that we can update old samples that would otherwise fail
    # new validation checks added since they were created
    # rubocop:disable Rails/SkipsModelValidations
    deletable_rails_objects.update_all(deleted_at: delete_timestamp)
    # rubocop:enable Rails/SkipsModelValidations

    # Update initial workflow on Rails samples or soft delete them
    count_by_workflow = get_workflow_counts(user, sample_ids, token)
    samples = current_power.destroyable_samples.where(id: sample_ids)
    soft_deleted_sample_ids = update_initial_workflows_or_soft_delete(samples, workflow, delete_timestamp, count_by_workflow)

    # log soft deletion for GDPR compliance
    deleted_objects_info = deletable_rails_objects
                           .joins(:sample, sample: :project)
                           .select(
                             :id,
                             "sample_id",
                             "samples.name AS sample_name",
                             "projects.name AS project_name",
                             "projects.id AS project_id"
                           ).as_json
    object_type = deletable_rails_objects.first.class.name

    deleted_objects_info.each do |object|
      DeletionLog.create!(
        object_id: object["id"],
        user_id: user.id,
        user_email: user.email,
        object_type: object_type,
        soft_deleted_at: delete_timestamp,
        metadata_json: {
          project_id: object["project_id"],
          project_name: object["project_name"],
          sample_id: object["sample_id"],
          sample_name: object["sample_name"],
          workflow: workflow,
        }.to_json
      )
    end

    deleted_samples_info = Sample.where(id: soft_deleted_sample_ids)
                                 .joins(:project)
                                 .select(
                                   "samples.id AS sample_id",
                                   "samples.name AS sample_name",
                                   "projects.id AS project_id",
                                   "projects.name AS project_name"
                                 ).as_json({ methods: [] })
    deleted_samples_info.each do |sample_info|
      DeletionLog.create!(
        object_id: sample_info["sample_id"],
        user_id: user.id,
        user_email: user.email,
        object_type: Sample.name,
        soft_deleted_at: delete_timestamp,
        metadata_json: {
          project_id: sample_info["project_id"],
          project_name: sample_info["project_name"],
          sample_id: sample_info["sample_id"],
          sample_name: sample_info["sample_name"],
        }.to_json
      )
    end

    unless nextgen_ids.empty?
      Resque.enqueue(HardDeleteNextgenObjects, user.id, nextgen_ids[:cg_ids], nextgen_ids[:sample_ids], nextgen_ids[:workflow_run_ids], nextgen_ids[:deprecated_workflow_run_ids], nextgen_ids[:bulk_download_workflow_run_ids], nextgen_ids[:bulk_download_entity_ids])
    end

    # First enqueue deletion of samples without workflow runs
    # This happens for short read mNGS uploads and for CG runs in NextGen,
    # since the workflow run lives in NextGen and the sample is duplicated in Rails
    sample_ids_without_wrs = sample_ids - deletable_rails_objects.pluck(:sample_id)
    unless sample_ids_without_wrs.empty?
      Resque.enqueue(HardDeleteObjects, [], sample_ids_without_wrs, workflow, user.id)
    end

    # then enqueue runs in batches, since deleting pipeline runs can take a long time
    unless deletable_rails_objects.empty?
      deletable_rails_objects.in_batches(of: HARD_DELETION_BATCH_SIZE) do |batch|
        # .transpose turns array [["run1", "sample1"], ["run2", "sample2"]] into [["run1", "run2"], ["sample1", "sample2"]]
        ids = batch.pluck(:id, :sample_id).transpose
        Resque.enqueue(HardDeleteObjects, ids[0], ids[1], workflow, user.id)
      end
    end

    # Warn if nothing to hard delete. This can happen when a user deletes failed
    # mNGS uploads but there are also failed AMR runs on the samples.
    if deletable_rails_objects.empty? && sample_ids_without_wrs.empty?
      LogUtil.log_message("No runs or samples to hard delete.",
                          sample_count_by_workflow: count_by_workflow,
                          object_ids: object_ids,
                          workflow_deleted: workflow)
    end

    should_read_from_nextgen = user.allowed_feature?("should_read_from_nextgen") && workflow == WorkflowRun::WORKFLOW[:consensus_genome]
    # Workflow run ids and sample ids in either system. This is unused by the frontend.
    deleted_run_ids = should_read_from_nextgen ? nextgen_ids[:workflow_run_ids] : deletable_rails_objects.pluck(:id)
    deleted_sample_ids = should_read_from_nextgen ? nextgen_ids[:sample_ids] : soft_deleted_sample_ids

    return {
      deleted_run_ids: deleted_run_ids,
      deleted_sample_ids: deleted_sample_ids,
    }
  end

  # Get counts for all samples using 4 queries
  # Get hash of sample ids that have a workflow of each type in the form
  # count = { [workflow] => set(sample_id1, sample_id2...) }
  def get_workflow_counts(user, sample_ids, token)
    counts = {}
    counts["short-read-mngs"] = PipelineRun.where(
      sample_id: sample_ids,
      deleted_at: nil,
      deprecated: false,
      technology: PipelineRun::TECHNOLOGY_INPUT[:illumina]
    ).pluck(:sample_id).to_set

    counts["long-read-mngs"] = PipelineRun.where(
      sample_id: sample_ids,
      deleted_at: nil,
      deprecated: false,
      technology: PipelineRun::TECHNOLOGY_INPUT[:nanopore]
    ).pluck(:sample_id).to_set

    counts["consensus-genome"] = if user.allowed_feature?("should_read_from_nextgen")
                                   BulkDeletionServiceNextgen.get_rails_samples_with_nextgen_workflow(
                                     user.id,
                                     sample_ids,
                                     WorkflowRun::WORKFLOW[:consensus_genome],
                                     token: token
                                   )
                                 else
                                   WorkflowRun.where(
                                     sample_id: sample_ids,
                                     deleted_at: nil,
                                     deprecated: false,
                                     workflow: WorkflowRun::WORKFLOW[:consensus_genome]
                                   ).pluck(:sample_id).to_set
                                 end

    counts["amr"] = WorkflowRun.where(
      sample_id: sample_ids,
      deleted_at: nil,
      deprecated: false,
      workflow: WorkflowRun::WORKFLOW[:amr]
    ).pluck(:sample_id).to_set

    counts
  end

  # If there are more remaining runs on the sample, update initial workflow
  # otherwise mark it for deletion
  def update_initial_workflows_or_soft_delete(samples, workflow_to_delete, timestamp, count_by_workflow)
    soft_deleted_sample_ids = []
    samples.each do |sample|
      if sample.initial_workflow == workflow_to_delete
        new_initial_workflow = get_new_initial_workflow(sample.id, workflow_to_delete, count_by_workflow)
        # rubocop:disable Rails/SkipsModelValidations
        if new_initial_workflow.nil?
          # no more remaining pipeline/workflow runs
          sample.update_attribute(:deleted_at, timestamp)
          soft_deleted_sample_ids << sample.id
        else
          sample.update_attribute(:initial_workflow, new_initial_workflow)
        end
        # rubocop:enable Rails/SkipsModelValidations
      end
    end
    return soft_deleted_sample_ids
  end

  # Find new initial workflow to reflect remaining analysis types on the sample
  def get_new_initial_workflow(sample_id, workflow_to_delete, count_by_workflow)
    # keep same initial workflow if there are more runs of that type (CG only right now)
    if count_by_workflow[workflow_to_delete].include?(sample_id)
      return workflow_to_delete
    end

    # hashes enumerate their values in the order the keys were inserted
    # so this will check short read mNGS -> long read mNGS -> CG -> AMR
    count_by_workflow.each do |workflow, sample_ids|
      if sample_ids.include?(sample_id)
        return workflow
      end
    end
    return nil
  end

  # Update or delete visualizations associated with the samples for these pipeline runs
  def handle_visualizations(sample_ids, delete_timestamp)
    viz = Visualization.joins(:samples).where("sample_id IN (?)", sample_ids).distinct
    viz_tables_trees = viz.where(visualization_type: ["table", "tree"])
    viz_phylo_trees = viz.where(visualization_type: ["phylo_tree"])
    viz_phylo_tree_ngs = viz.where(visualization_type: ["phylo_tree_ng"])
    viz_heatmaps = viz.where(visualization_type: "heatmap")

    # Tables/Trees: Delete them since they are only associated with one sample (unrelated to phylotree).
    viz_tables_trees.each(&:destroy!)

    # Heatmaps: Remove samples from existing heatmaps (heatmaps have >2 samples).
    viz_heatmaps.each do |viz_heatmap|
      n_samples_after_deletion = viz_heatmap.sample_ids.length - viz_heatmap.sample_ids.to_a.count { |sample_id| sample_ids.include? sample_id }

      # If too few samples will be left after deletion, remove the heatmap entirely
      if n_samples_after_deletion < 2
        viz_heatmap.destroy!
      # Otherwise, only remove the samples from the heatmap
      else
        viz_heatmap.samples = viz_heatmap.samples.select { |sample| sample_ids.exclude? sample.id }
      end
    end

    # Deprecated phylo-trees: Delete them (associated with multiple samples but no longer supported)
    viz_phylo_trees.each do |viz_phylo_tree|
      phylo_tree = PhyloTree.find_by(id: viz_phylo_tree.data["treeId"])

      # Mark phylo tree/S3 data for deletion and unlist from UI
      phylo_tree.update(deleted_at: delete_timestamp)
      viz_phylo_tree.destroy!
    end

    # Phylo-trees: Handle non-deprecated phylo trees.
    viz_phylo_tree_ngs.each do |viz_phylo_tree_ng|
      phylo_tree_ng = PhyloTreeNg.find_by(id: viz_phylo_tree_ng.data["treeNgId"])
      n_samples_after_deletion = phylo_tree_ng.pipeline_run_ids.length - phylo_tree_ng.pipeline_runs.pluck(:sample_id).count { |sample_id| sample_ids.include? sample_id }

      # Mark phylo tree/S3 data for deletion and unlist from UI (whether re-run or not).
      phylo_tree_ng.update(deleted_at: delete_timestamp)
      viz_phylo_tree_ng.destroy!

      # If we still have enough samples deletion, re-run it without the current samples to delete.
      if n_samples_after_deletion >= 4 && !phylo_tree_ng.deprecated
        new_pipeline_run_ids = phylo_tree_ng.pipeline_runs.select { |pr| sample_ids.exclude? pr.sample_id }.pluck(:id)
        # Re-run the phylo tree, which creates a new phylo tree entirely.
        phylo_tree_ng.rerun(new_pipeline_run_ids)
      end
    end
  end

  # Mark associated bulk downloads for deletion in Rails
  # TODO: return ids here and pass them to the hard delete job
  def handle_bulk_downloads(deletable_objects, delete_timestamp)
    # Unlike `.update`, `.update_attribute` & `.update_all` skip model validations (i.e.
    # column X must satisfy certain conditions), and skips updating `updated_at`. This is needed to make sure we mark
    # for deletion old rows that were created before we added new validations to the model (which would now fail, but
    # we still want to delete them regardless), e.g. see `validate :params_checks` in bulk_download.rb.
    # rubocop:disable Rails/SkipsModelValidations
    deletable_objects.each do |run|
      run.bulk_downloads.update_all(deleted_at: delete_timestamp)
    end
    # rubocop:enable Rails/SkipsModelValidations
  end
end
