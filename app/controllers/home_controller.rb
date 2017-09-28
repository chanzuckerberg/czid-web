class HomeController < ApplicationController
  def home
    @final_result = []
    @samples = Sample.includes(:pipeline_runs).paginate(page: params[:page]).order('created_at DESC')
    @project_info = @samples.first.project

    @samples.each do |output|
      output_data = {}
      pipeline_info = output.pipeline_runs.first ? output.pipeline_runs.first.pipeline_output : nil
      pipeline_run = output.pipeline_runs.first

      output_data[:pipeline_info] = pipeline_info
      output_data[:pipeline_run] = pipeline_run
      @final_result.push(output_data)
    end
    
  end
end
