module BenchmarksHelper
  IDSEQ_BENCH_BUCKET = "idseq-bench".freeze
  IDSEQ_BENCH_KEY = "config.json".freeze

  def benchmarks_list
    benchmarks = {}

    # Read benchmarks from configuration store in S3
    benchmark_config = load_benchmarks_config()
    if benchmark_config
      benchmarks = parse_config(benchmark_config)

      benchmarks[:active_benchmarks].each do |benchmark|
        # get the most recent finished sample of this benchmark
        sample = Sample
                 .includes(:pipeline_runs)
                 .where(project: Project.find_by(name: benchmark[:project_name]))
                 .last
        benchmark[:last_run] = nil
        if sample
          benchmark[:last_run] = {
            sample_name: sample.name,
            pipeline_version: sample.first_pipeline_run.pipeline_version,
          }
        end
      end
    end

    return benchmarks
  end

  def load_benchmarks_config
    s3_response = S3_CLIENT.get_object(bucket: IDSEQ_BENCH_BUCKET, key: IDSEQ_BENCH_KEY)
    return JSON.parse(s3_response.body.read, symbolize_names: true)
  rescue Aws::S3::Errors::NoSuchKey
    LogUtil.log_err("Config file not found - '#{IDSEQ_BENCH_KEY}'")
    return nil
  rescue JSON::ParserError
    LogUtil.log_err("Invalid config file - '#{IDSEQ_BENCH_KEY}'")
    return nil
  rescue => e
    LogUtil.log_err("Unknown error - '#{e.message}'")
    return nil
  end

  def parse_config(benchmark_config)
    parsed_config = {}

    default_options = benchmark_config[:defaults] || {}
    [:active_benchmarks, :retired_benchmarks].each do |benchmarks_type|
      parsed_config[benchmarks_type] = benchmark_config[benchmarks_type].collect do |path, options|
        # add defaults to all benchmarks
        default_options
          .merge(options)
          .merge(path: path.to_s)
      end.select do |options|
        options[:environments].include?(ENV['RAILS_ENV'])
      end
    end

    return parsed_config
  end
end
