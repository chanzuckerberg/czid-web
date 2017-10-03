class HomeController < ApplicationController

  def home
    @output_data = {}
    @samples = Sample.includes(:pipeline_outputs, :pipeline_runs).paginate(page: params[:page]).order('created_at DESC')

    @samples.each do |output|
      if output.pipeline_runs.length && output.pipeline_runs.first
        pipeline_output_info = output.pipeline_runs.first.pipeline_output
        @output_data['pipeline_output_info'] = pipeline_output_info
      end
      pipeline_run_info = output.pipeline_runs.first
      @output_data['pipeline_run_info'] = pipeline_run_info
      project_info = output.project
      @output_data['project_info'] = project_info
    end
  end
end   
