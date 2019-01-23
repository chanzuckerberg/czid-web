# Jos to check the status of pipeline runs
require 'English'
require 'thread/pool'

# Benchmark status will not be updated faster than this.
IDSEQ_BENCH_UPDATE_FREQUENCY_SECONDS = 600

# A benchmark sample will not be resubmitted faster than this.
IDSEQ_BENCH_MIN_FREQUENCY_HOURS = 1.0

# This is under version control at idseq-web/config/idseq-bench-config.json, and deployed
# by copying to the S3 location below.
IDSEQ_BENCH_CONFIG = "s3://idseq-bench/config.json".freeze

class CheckPipelineRuns
  # Concurrency allowed
  MAX_SHARDS = 10
  MIN_JOBS_PER_SHARD = 20

  @sleep_quantum = 5.0

  @shutdown_requested = false

  class << self
    attr_accessor :shutdown_requested
  end

  def self.update_jobs(num_shards, shard_id, pr_ids, pt_ids)
    ActiveRecord::Base.connection.reconnect! if shard_id > 0
    num_pr = pr_ids.count
    num_pt = pt_ids.count
    Rails.logger.info("New pipeline monitor loop started with #{num_pr} pr and #{num_pt} pt. shard #{shard_id} out of #{num_shards}")
    pr_ids.each do |prid|
      next unless prid % num_shards == shard_id
      pr = PipelineRun.find(prid)
      begin
        break if @shutdown_requested
        Rails.logger.info("  Checking pipeline run #{pr.id} for sample #{pr.sample_id}")
        pr.update_job_status
      rescue => exception
        LogUtil.log_err_and_airbrake("Failed to update pipeline run #{pr.id}")
        LogUtil.log_backtrace(exception)
      end
    end

    pt_ids.in_progress.each do |ptid|
      next unless ptid % num_shards == shard_id
      pt = PhyloTree.find(ptid)
      begin
        break if @shutdown_requested
        Rails.logger.info("Monitoring job for phylo_tree #{pt.id}")
        pt.monitor_job
      rescue => exception
        LogUtil.log_err_and_airbrake("Failed monitor job for phylo_tree #{pt.id}")
        LogUtil.log_backtrace(exception)
      end
    end
  end

  def self.forced_update_interval
    # Force refresh well before autoscaling.EXPIRATION_PERIOD_MINUTES.
    # prod does it more often because it needs to pick up updates from
    # all other environments and adjust the autoscaling groups.
    cloud_env = ["prod", "staging"].include?(Rails.env)
    Rails.env == cloud_env ? 60 : 600
  end

  def self.autoscaling_update(autoscaling_state, t_now)
    return if Rails.env == "development"
    unless autoscaling_state
      autoscaling_state = {
        t_last: t_now - forced_update_interval,
        chunk_counts: nil
      }
    end
    last_chunk_counts = autoscaling_state[:chunk_counts]
    new_chunk_counts = PipelineRun.count_alignment_chunks_in_progress
    if last_chunk_counts.nil?
      Rails.logger.info("Autoscaling update to #{new_chunk_counts} chunks.")
    else
      Rails.logger.info("Autoscaling update from #{last_chunk_counts} chunks to #{new_chunk_counts} chunks.")
    end
    autoscaling_state[:t_last] = t_now
    autoscaling_state[:chunk_counts] = new_chunk_counts
    autoscaling_config = {
      'mode' => 'update',
      'gsnapl' => {
        'num_chunks' => new_chunk_counts[:gsnap],
        'max_concurrent' => PipelineRun::GSNAP_MAX_CONCURRENT
      },
      'rapsearch2' => {
        'num_chunks' => new_chunk_counts[:rapsearch],
        'max_concurrent' => PipelineRun::RAPSEARCH_MAX_CONCURRENT
      },
      'my_environment' => Rails.env,
      'max_job_dispatch_lag_seconds' => PipelineRun::MAX_JOB_DISPATCH_LAG_SECONDS,
      'job_tag_prefix' => PipelineRun::JOB_TAG_PREFIX,
      'job_tag_keep_alive_seconds' => PipelineRun::JOB_TAG_KEEP_ALIVE_SECONDS,
      'draining_tag' => PipelineRun::DRAINING_TAG
    }
    c_stdout, c_stderr, c_status = Open3.capture3("app/jobs/autoscaling.py '#{autoscaling_config.to_json}'")
    Rails.logger.info(c_stdout)
    Rails.logger.error(c_stderr) unless c_status.success? && c_stderr.blank?
    autoscaling_state
  end

  def self.benchmark_sample_name(s3path, timestamp_str, metadata_prefix)
    # Benchmark sample names start with a prefix determined uniquely from the s3 path,
    # like so: "idseq-bench-1|".  This enables finding quickly all samples submitted for
    # a given benchmark.  That text is followed by a unix timestamp of the creation time,
    # only because within a project, sample names must be unique.  Finally, a long metadata_prefix
    # describes the benchmark contents.  The whole thing looks like
    # "idseq-bench-1|1539204106|norg_1|nacc_1|uniform_weight_per_organism|hiseq_reads|viruses|chikungunya|37124|v4"
    items = s3path.split("/")
    result = items[-2] + "-" + items[-1] + "|"
    return result if timestamp_str.blank?
    result = result + timestamp_str + "|"
    return result if metadata_prefix.blank?
    result + metadata_prefix.gsub("__", "|") # vertical bars are prettier
  end

  def self.benchmark_sample_name_prefix(s3path)
    benchmark_sample_name(s3path, "", "")
  end

  def self.create_sample_for_benchmark(s3path, pipeline_commit, web_commit, bm_pipeline_branch, bm_user, bm_project, bm_host, bm_comment, t_now)
    # metadata.json is produced by idseq-bench
    raw_metadata = `aws s3 cp #{s3path}/metadata.json -`
    metadata = JSON.parse(raw_metadata)
    input_files_attributes = metadata['fastqs'].map do |fq|
      {
        name: fq,
        source: s3path + "/" + fq,
        source_type: "s3"
      }
    end
    unless metadata['idseq_bench_reproducible'] && metadata['idseq_bench_git_hash'].length == 40
      raise "Refusing to create sample for irreproducible benchmark #{s3path}"
    end
    Rails.logger.info("Creating benchmark sample from #{s3path} with #{metadata['verified_total_reads']} reads.")
    bm_sample_name = benchmark_sample_name(s3path, t_now.floor.to_s, metadata['prefix'])
    # Add benchmark comment to existing metadata, and dump metadata json into sample_notes.
    # Tags added here are capitalized.  If a COMMENT tag already exists in metadata, prepend to it.
    existing_comment = metadata['COMMENT']
    comment_separator = "\n"
    comment_separator = "" if existing_comment.blank?
    comment_separator = "" if bm_comment.blank?
    new_metadata = {}
    # HACK: We want COMMENT and ORIGIN to appear at the top in the json dump, and this trick does it.
    new_metadata['COMMENT'] = (bm_comment || "") + comment_separator + (existing_comment || "")
    new_metadata['ORIGIN'] = s3path
    metadata.each do |k, v|
      next if k == "COMMENT"
      next if k == "ORIGIN"
      new_metadata[k] = v
    end
    known_organisms = metadata['verified_contents'].pluck('genome').join(", ")
    bm_sample_params = {
      name: bm_sample_name,
      host_genome_id: bm_host.id,
      project_id: bm_project.id,
      user_id: bm_user.id,
      input_files_attributes: input_files_attributes,
      sample_organism: known_organisms,
      web_commit: web_commit,
      pipeline_commit: pipeline_commit,
      pipeline_branch: bm_pipeline_branch,
      sample_notes: JSON.pretty_generate(new_metadata)
    }
    @bm_sample = Sample.new(bm_sample_params)
    # HACK: Not really sure why we have to manually set the status to STATUS_CREATED here,
    # but if we don't, the sample is never picked up by the uploader.
    @bm_sample.status ||= Sample::STATUS_CREATED
    unless @bm_sample.save
      raise "Error creating benchmark sample with #{JSON.pretty_generate(bm_sample_params)}."
    end
    Rails.logger.info("Benchmark sample #{@bm_sample.id} created successfully.")
  end

  def self.prop_get(dict, property, defaults)
    return dict[property] if dict.key?(property)
    defaults[property]
  end

  def self.benchmark_update(t_now)
    Rails.logger.info("Benchmark update.")
    config = JSON.parse(`aws s3 cp #{IDSEQ_BENCH_CONFIG} -`)
    defaults = config['defaults']
    web_commit = ENV['GIT_VERSION'] || ""
    config['active_benchmarks'].each do |s3path, bm_props|
      bm_environments = prop_get(bm_props, 'environments', defaults)
      unless bm_environments.include?(Rails.env)
        Rails.logger.info("Benchmark does not apply to #{Rails.env} environment: #{s3path}")
        next
      end
      bm_project_name = prop_get(bm_props, 'project_name', defaults)
      bm_proj = Project.find_by(name: bm_project_name)
      unless bm_proj
        Rails.logger.info("Benchmark requires non-existent project #{bm_project_name}: #{s3path}")
        next
      end
      bm_frequency_hours = prop_get(bm_props, 'frequency_hours', defaults)
      bm_frequency_seconds = bm_frequency_hours * 3600
      unless bm_frequency_hours >= IDSEQ_BENCH_MIN_FREQUENCY_HOURS
        Rails.logger.info("Benchmark frequency under #{IDSEQ_BENCH_MIN_FREQUENCY_HOURS} hour: #{s3path}")
        next
      end
      bm_name_prefix = benchmark_sample_name_prefix(s3path)
      sql_query = "
        SELECT
          id,
          project_id,
          unix_timestamp(created_at) as unixtime_of_creation
        FROM samples
        WHERE
              project_id = #{bm_proj.id}
          AND created_at > from_unixtime(#{t_now - bm_frequency_seconds})
          AND name LIKE \"#{bm_name_prefix}%\"
      "
      bm_pipeline_branch = prop_get(bm_props, "pipeline_branch", defaults)
      pipeline_commit = Sample.pipeline_commit(bm_pipeline_branch) || ""
      commit_filter = ""
      if pipeline_commit.present? && prop_get(bm_props, "trigger_on_pipeline_change", defaults)
        sql_query += "    AND pipeline_commit = \"#{pipeline_commit}\""
        commit_filter += "on " + pipeline_commit
      end
      if web_commit.present? && prop_get(bm_props, "trigger_on_webapp_change", defaults)
        sql_query += "    AND web_commit = \"#{web_commit}\""
        commit_filter += "-" + web_commit
      end
      sql_results = Sample.connection.select_all(sql_query).to_hash
      unless sql_results.empty?
        most_recent_submission = sql_results.pluck('unixtime_of_creation').max
        hours_since_last_run = Integer((t_now - most_recent_submission) / 360) / 10.0
        Rails.logger.info("Benchmark last ran #{hours_since_last_run} hours ago #{commit_filter}: #{s3path}")
        next
      end
      Rails.logger.info("Submitting benchmark: #{s3path}")
      bm_user_email = prop_get(bm_props, 'user_email', defaults)
      bm_user = User.find_by(email: bm_user_email)
      bm_host_name = prop_get(bm_props, 'host', defaults)
      bm_host = HostGenome.find_by(name: bm_host_name)
      bm_comment = prop_get(bm_props, 'comment', defaults)
      begin
        create_sample_for_benchmark(s3path, pipeline_commit, web_commit, bm_pipeline_branch, bm_user, bm_proj, bm_host, bm_comment, t_now)
      rescue => exception
        LogUtil.log_err_and_airbrake("Failed to create sample for benchmark #{s3path}")
        LogUtil.log_backtrace(exception)
      end
    end
  end

  def self.benchmark_update_safely_and_not_too_often(benchmark_state, t_now)
    unless benchmark_state && t_now - benchmark_state[:t_last] < IDSEQ_BENCH_UPDATE_FREQUENCY_SECONDS
      benchmark_state = { t_last: t_now }
      begin
        benchmark_update(t_now)
      rescue => exception
        LogUtil.log_err_and_airbrake("Failed to update benchmarks")
        LogUtil.log_backtrace(exception)
      end
    end
    benchmark_state
  end

  def self.run(duration, min_refresh_interval)
    Rails.logger.info("Checking the active pipeline runs every #{min_refresh_interval} seconds over the next #{duration / 60} minutes.")
    t_now = Time.now.to_f # unixtime
    # Will try to return as soon as duration seconds have elapsed, but not any sooner.
    t_end = t_now + duration
    autoscaling_state = nil
    benchmark_state = nil
    # The duration of the longest update so far.
    max_work_duration = 0
    iter_count = 0
    until @shutdown_requested
      iter_count += 1
      t_iter_start = t_now
      pr_ids =  PipelineRun.in_progress.pluck(:id)
      pt_ids = PhyloTree.in_progress.pluck(:id)
      num_shards = ((pr_ids.count + pt_ids.count)/MIN_JOBS_PER_SHARD).to_i
      num_shards = [[num_shards, MAX_SHARDS].min, 1].max
      fork_pids = []
      shard_id = 0
      while shard_id < num_shards
        pid = Process.fork { update_jobs(num_shards, shard_id, pr_ids, pt_ids) }
        fork_pids << pid
        shard_id += 1
      end
      fork_pids.each { |p| Process.waitpid(p) }
      autoscaling_state = autoscaling_update(autoscaling_state, t_now)
      benchmark_state = benchmark_update_safely_and_not_too_often(benchmark_state, t_now)
      t_now = Time.now.to_f
      max_work_duration = [t_now - t_iter_start, max_work_duration].max
      t_iter_end = [t_now, t_iter_start + min_refresh_interval].max
      break unless t_iter_end + max_work_duration < t_end
      while t_now < t_iter_end && !@shutdown_requested
        # Ensure no iteration is shorter than min_refresh_interval.
        sleep [t_iter_end - t_now, @sleep_quantum].min
        t_now = Time.now.to_f
      end
    end
    while t_now < t_end && !@shutdown_requested
      # In this case (t_end - t_now) < max_work_duration.
      sleep [t_end - t_now, @sleep_quantum].min
      t_now = Time.now.to_f
    end
    Rails.logger.info("Exited loop after #{iter_count} iterations.")
  end
end

task "pipeline_monitor", [:duration] => :environment do |_t, args|
  trap('SIGTERM') do
    CheckPipelineRuns.shutdown_requested = true
  end
  # spawn a new finite duration process every 60 minutes
  respawn_interval = 60 * 60
  # rate-limit status updates
  cloud_env = ["prod", "staging"].include?(Rails.env)
  checks_per_minute = cloud_env ? 4.0 : 1.0
  # make sure the system is not overwhelmed under any cirmustances
  wait_before_respawn = cloud_env ? 5 : 30
  additional_wait_after_failure = 25

  # don't show all the SQL debug info in the logs, and throttle data sent to Honeycomb
  Rails.logger.level = [1, Rails.logger.level].max
  HoneycombRails.config.sample_rate = 120

  if args[:duration] == "finite_duration"
    CheckPipelineRuns.run(respawn_interval - wait_before_respawn, 60.0 / checks_per_minute)
  else
    # infinite duration
    if cloud_env
      Rails.logger.info("HACK: Sleeping 30 seconds on daemon startup for prior incarnations to drain.")
      sleep 30
    end
    until CheckPipelineRuns.shutdown_requested
      system("rake pipeline_monitor[finite_duration]")
      sleep wait_before_respawn
      unless $CHILD_STATUS.exitstatus.zero?
        sleep additional_wait_after_failure
      end
    end
  end
end
