class ReadsStatsService
  include PipelineRunsHelper
  include Callable

  INITIAL_READS_STAT = "fastqs".freeze

  def initialize(samples)
    if samples.nil?
      Rails.logger.warn("ReadsStatsService call with samples = nil")
      samples = []
    end
    select_params = [:sample_id, :wdl_version, :pipeline_version, :pipeline_execution_strategy, :sfn_execution_arn]
    @viewable_pipeline_runs = get_succeeded_pipeline_runs_for_samples(samples, false, select_params)
    @viewable_pipeline_run_ids = @viewable_pipeline_runs.map(&:id)
    @sample_names = {}
    samples.each { |sample| @sample_names[sample.id] = sample.name }
  end

  def call
    reads_stats = get_job_stats(@viewable_pipeline_run_ids)
    step_orders = get_step_orders(@viewable_pipeline_runs)
    results = order_stats(@viewable_pipeline_runs, reads_stats, step_orders)
    results.each { |sample_id, stats| stats[:name] = @sample_names[sample_id] }
    return results
  end

  private

  # transform job stats query into hashmap
  def get_job_stats(pipeline_run_ids)
    reads_stats = {}
    job_stats = JobStat.where(pipeline_run_id: pipeline_run_ids).select(:task, :reads_after, :pipeline_run_id)
    job_stats.each do |stat|
      unless reads_stats.key?(stat.pipeline_run_id)
        reads_stats[stat.pipeline_run_id] = { steps: [], initialReads: nil }
      end
      if stat.task == INITIAL_READS_STAT
        reads_stats[stat.pipeline_run_id][:initialReads] = stat.reads_after
      else
        reads_stats[stat.pipeline_run_id][:steps].push(name: stat.task, reads_after: stat.reads_after)
      end
    end
    return reads_stats
  end

  # get all possible step orders
  def get_step_orders(pipeline_runs)
    step_orders = {}
    unique_versions = pipeline_runs.group(:wdl_version, :pipeline_version)
    unique_versions.each do |uniq|
      ordered_tasks = uniq.host_filtering_stage.step_statuses.keys
      # save in step_orders hash according to [wdl_version][pipeline_version]
      wdl_version = uniq.wdl_version.to_s
      pipeline_version = uniq.pipeline_version.to_s
      unless step_orders.key?(wdl_version)
        step_orders[wdl_version] = {}
      end
      step_orders[wdl_version][pipeline_version] = ordered_tasks
    end
    return step_orders
  end

  # order stats for each sample
  def order_stats(pipeline_runs, reads_stats, step_orders)
    results = {}
    pipeline_runs.each do |pr|
      stats_hash = reads_stats[pr.id]
      stats_hash[:sampleId] = pr.sample_id

      wdl_version = pr.wdl_version.to_s
      stats_hash[:wdlVersion] = wdl_version
      pipeline_version = pr.pipeline_version.to_s
      stats_hash[:pipelineVersion] = pipeline_version
      step_order = step_orders[wdl_version][pipeline_version]
      stats_hash[:steps] = step_order.map do |step|
        step_stats = stats_hash[:steps].find { |step_hash| step_hash[:name] == step }
        # Frontend can handle a nil case if step is not found
        reads_after = step_stats.nil? ? nil : step_stats[:reads_after]
        { name: StringUtil.humanize_step_name(step), readsAfter: reads_after }
      end
      results[pr.sample_id] = stats_hash
    end
    return results
  end
end
