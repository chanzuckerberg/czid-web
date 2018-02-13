class ProjectsController < ApplicationController
  include SamplesHelper
  include ReportHelper
  ########################################
  # Note to developers:
  # If you are adding a new action to the project controller, you must classify your action into
  # READ_ACTIONS: where current_user has read access of the project
  # EDIT_ACTIONS: where current_user has update access of the project
  # OTHER_ACTIONS: where the actions access multiple projects or non-existing projects.
  #                access control should still be checked as neccessary through current_power
  #
  ##########################################

  READ_ACTIONS = [:show, :add_favorite, :remove_favorite, :make_project_reports_csv, :project_reports_csv_status, :send_project_reports_csv].freeze
  EDIT_ACTIONS = [:edit, :update, :destroy, :add_user, :all_emails, :update_project_visibility].freeze
  OTHER_ACTIONS = [:create, :new, :index, :send_project_csv].freeze

  power :projects, map: { EDIT_ACTIONS => :updatable_projects }, as: :projects_scope

  before_action :set_project, only: READ_ACTIONS + EDIT_ACTIONS
  before_action :assert_access, only: OTHER_ACTIONS
  before_action :check_access

  clear_respond_to
  respond_to :json

  # GET /projects
  # GET /projects.json
  def index
    @projects = current_power.projects
  end

  # GET /projects/1
  # GET /projects/1.json
  def show
    @samples = current_power.project_samples(@project)
    # all exisiting project are null, we ensure private projects are explicitly set to 0
    respond_to do |format|
      format.html
      format.json do
        render json: {
          id: @project.id,
          name: @project.name,
          public_access: @project.public_access.to_i,
          created_at: @project.created_at
        }
      end
    end
  end

  def send_project_csv
    if params[:id] == 'all'
      samples = current_power.samples
      project_name = "all-projects"
    else
      project = current_power.projects.find(params[:id])
      samples = current_power.project_samples(project)
      project_name = "project-#{project.name.downcase.split(' ').join('_')}"
    end
    formatted_samples = format_samples(samples)
    project_csv = generate_sample_list_csv(formatted_samples)
    send_data project_csv, filename: project_name + '_sample-table.csv'
  end

  def update_project_visibility
    errors = []
    public_access = params[:public_access] ? params[:public_access].to_i : nil

    errors.push('Project id is Invalid') unless @project
    errors.push('Access value is empty') if public_access.nil?

    if errors.empty?
      @project.update(public_access: public_access)
      render json: {
        message: 'Project visibility updated successfully',
        status: :accepted
      }
    else
      render json: {
        message: 'Unable to set visibility for project',
        status: :unprocessable_entity,
        errors: errors
      }
    end
  end

  def make_project_reports_csv
    user_id = current_user.id
    `aws s3 rm #{@project.report_tar_s3(user_id)}`
    params["user_id"] = user_id
    Resque.enqueue(GenerateProjectReportsCsv, params)
    render json: { status_display: project_reports_progress_message }
  end

  def project_reports_csv_status
    final_complete = `aws s3 ls #{@project.report_tar_s3(current_user.id)} | wc -l`.to_i == 1
    if final_complete
      render json: { status_display: "complete" }
      return
    end
    render json: { status_display: project_reports_progress_message }
  end

  def send_project_reports_csv
    user_id = current_user.id
    output_file = @project.report_tar(user_id)
    `aws s3 cp #{@project.report_tar_s3(user_id)} #{output_file}`
    send_file output_file
  end

  # GET /projects/new
  def new
    @project = Project.new
  end

  # GET /projects/1/edit
  def edit
  end

  # Get /projects/1/visuals
  def visuals
    # TODO(cyril/yf): the following no longer work because Report model is gone
    # project_id = params[:id]
    # if project_id
    #  project_info = Project.select('name').where(id: project_id)
    # @project_name = project_info[0].name if project_info[0]
    # we can avoid many joins, when we create a relationship between reports and projects, or with the samples
    # time_start = Time.now
    # sql = <<-SQL
    # SELECT samples.name, reports.id FROM projects
    # INNER JOIN samples ON projects.id = samples.project_id
    # INNER JOIN pipeline_outputs ON samples.id = pipeline_outputs.sample_id
    # INNER JOIN reports ON reports.pipeline_output_id = pipeline_outputs.id
    # WHERE projects.id = ?
    # SQL
    # @csv_records = []
    # find_reports = ActiveRecord::Base.connection.raw_connection.prepare(sql).execute(project_id)
    # time_end = Time.now
    # p 'Query took', "#{(time_end - time_start)} seconds"
    # find_reports.each do |record|
    #  @csv_records.push(name: record.first, link: fetch_csv_url(record.last))
    # end
    # end
  end

  def add_favorite
    remove_favorite
    current_user.favorites << @project
  end

  def remove_favorite
    if current_user.favorites.include? @project
      current_user.favorites.delete(@project)
    end
  end

  # POST /projects
  # POST /projects.json
  def create
    @project = Project.new(project_params)
    @project.users << current_user

    respond_to do |format|
      if @project.save
        format.html { redirect_to @project, notice: 'Project was successfully created.' }
        format.json { render :show, status: :created, location: @project }
      else
        format.html { render :new }
        format.json { render json: @project.errors.full_messages, status: :unprocessable_entity }
      end
    end
  end

  # PATCH/PUT /projects/1
  # PATCH/PUT /projects/1.json
  def update
    respond_to do |format|
      if @project.update(project_params)
        format.html { redirect_to @project, notice: 'Project was successfully updated.' }
        format.json { render :show, status: :ok, location: @project }
      else
        format.html { render :edit }
        format.json { render json: @project.errors.full_messages, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /projects/1
  # DELETE /projects/1.json
  def destroy
    @project.destroy
    respond_to do |format|
      format.html { redirect_to projects_url, notice: 'Project was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  def all_emails
    render json: { emails: @project.users.map(&:email) }
  end

  def add_user
    @user = User.find_by(email: params[:user_email_to_add])
    if @user
      UserMailer.added_to_projects_email(@user.id, shared_project_email_arguments).deliver_now unless @project.user_ids.include? @user.id
    else
      create_new_user_random_password(params[:user_email_to_add])
    end
    @project.user_ids |= [@user.id]
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def create_new_user_random_password(email)
    user_params_with_password = { email: email }
    random_password = SecureRandom.hex(10)
    user_params_with_password[:password] = random_password
    user_params_with_password[:password_confirmation] = random_password
    @user ||= User.new(user_params_with_password)
    @user.email_arguments = shared_project_email_arguments('new_user_new_project')
    @user.send_reset_password_instructions if @user.save
  end

  def shared_project_email_arguments(email_template = nil)
    { email_subject: 'New project on IDseq',
      email_template: email_template,
      sharing_user_id: current_user.id,
      shared_project_id: @project.id }
  end

  def set_project
    @project = projects_scope.find(params[:id])
    assert_access
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def project_params
    params.require(:project).permit(:name, :public_access, user_ids: [], sample_ids: [])
  end

  def project_reports_progress_message
    "In progress (project #{@project.name})"
  end
end
