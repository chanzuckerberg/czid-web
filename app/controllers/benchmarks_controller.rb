class BenchmarksController < ApplicationController

  before_action :authenticate_user!
  before_action :authenticate_user_from_token!

  before_action :admin_required

  IDSEQ_BENCH_BUCKET = "idseq-bench".freeze
  IDSEQ_BENCH_KEY = "config.json".freeze

  S3_CLIENT = Aws::S3::Client.new

  def index
    benchmarks = []

    # Read benchmarks from configuration store in S3
    benchmark_config = get_config()
    if benchmark_config
      benchmarks = parse_config(benchmark_config)

      benchmarks[:active_benchmarks].each do |benchmark|
        # get the most recent finished sample for this benchmark
        sample = Sample
          .includes(:pipeline_runs)
          .where(project: Project.find_by_name(benchmark["project_name"]))
          .last
        benchmark[:last_run] = {
          sample_name: sample.name,
          pipeline_version: sample.first_pipeline_run.version
        }
      end
    end

    respond_to do |format|
      format.json do
        render json: benchmarks
      end
    end
  end

  private

  def get_config
    s3_response = S3_CLIENT.get_object(bucket: IDSEQ_BENCH_BUCKET, key: IDSEQ_BENCH_KEY)
    return JSON.parse(s3_response.body.read,:symbolize_names => true)
  rescue Aws::S3::Errors::NoSuchKey
    Rails.logger.error("Benchmark : config not found")
    return nil
  rescue JSON::ParserError
    Rails.logger.error("Benchmark : invalid config file")
    return nil
  end

  def parse_config(benchmark_config)
    parsed_config = {}

    # apply defaults
    default_options = benchmark_config[:defaults]
    [:active_benchmarks, :retired_benchmarks].each do |benchmarks_type|
      parsed_config[benchmarks_type] = benchmark_config[benchmarks_type].collect do |path, options|
        default_options
          .merge(options)
          .merge({path: path})
      end.select do |options|
        # !!!!!! FOR TESTING !!!!!!
        # options[:environments].include?(ENV['RAILS_ENV'])
        options[:environments].include?("staging")
      end

      # remove environments variable for isolation
      parsed_config[benchmarks_type].delete(:environments)
    end

    return parsed_config
  end
end
