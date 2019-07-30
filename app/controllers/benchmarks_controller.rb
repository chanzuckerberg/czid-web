class BenchmarksController < ApplicationController
  include BenchmarksHelper

  before_action :authenticate_user!
  before_action :admin_required

  def index
    benchmarks = helpers.benchmarks_list()

    # clean fields that should not be exposed
    benchmarks.keys.each do |benchmarks_type|
      benchmarks[benchmarks_type] = benchmarks[benchmarks_type].map do |benchmark|
        benchmark.except(:environments, :how_to_use_these_defaults, :path, :pipeline_branch)
      end
    end

    respond_to do |format|
      format.json do
        render json: benchmarks
      end
    end
  end
end
