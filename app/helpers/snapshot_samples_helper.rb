module SnapshotSamplesHelper
  include PipelineOutputsHelper
  include PipelineRunsHelper

  def samples_by_share_id(share_id)
    snapshot = SnapshotLink.find_by(share_id: share_id)
    if snapshot.present?
      sample_ids = []
      content = JSON.parse(snapshot.content)
      content["samples"].reduce(sample_ids) do |ids, sample|
        ids << sample.collect { |id, _| id }
      end
      Sample.where(id: sample_ids.flatten)
    end
  end

  def snapshot_pipeline_run_info(pipeline_run, output_states_by_pipeline_run_id)
    pipeline_run_entry = {}
    pipeline_run_entry[:result_status_description] = pipeline_run ? pipeline_run.status_display(output_states_by_pipeline_run_id) : 'WAITING'
    pipeline_run_entry
  end

  def snapshot_pipeline_runs_multiget(sample_ids, share_id)
    snapshot = SnapshotLink.find_by(share_id: share_id)
    if snapshot.present?
      pipeline_run_ids = snapshot_pipeline_run_ids(snapshot)
      pipeline_runs = PipelineRun.where("id in (?) and sample_id in (?)", pipeline_run_ids, sample_ids)
      pipeline_runs_by_sample_id = pipeline_runs.index_by(&:sample_id)
      pipeline_runs_by_sample_id
    end
  end

  def snapshot_pipeline_versions(snapshot)
    pipeline_run_ids = snapshot_pipeline_run_ids(snapshot)
    pipeline_versions = PipelineRun.where(id: pipeline_run_ids).pluck(:pipeline_version)
    pipeline_versions.to_set
  end

  def snapshot_pipeline_run_ids(snapshot)
    pipeline_run_ids = []
    content = JSON.parse(snapshot.content)
    content["samples"].reduce(pipeline_run_ids) do |pr_ids, sample|
      pr_ids << sample.collect do |_, info|
        info["pipeline_run_id"]
      end
    end
    pipeline_run_ids.flatten
  end
end
