class HomeController < ApplicationController
  def home
    @output_data = {}
    @samples = Sample.paginate(page: params[:page]).order('created_at DESC')

    @samples.each do |output|
      pipeline_output_info = output.pipeline_outputs.order('created_at').last
      project_info = output.project
      @output_data['pipeline_output_info'] = pipeline_output_info
      @output_data['project_info'] = project_info
    end
  end
end
