class ProjectsController < ApplicationController
  include ApplicationHelper
  include AwsHelper
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

  READ_ACTIONS = [:show, :add_favorite, :remove_favorite, :make_host_gene_counts, :host_gene_counts_status, :send_host_gene_counts, :make_project_reports_csv, :project_reports_csv_status, :send_project_reports_csv, :visuals].freeze
  EDIT_ACTIONS = [:edit, :update, :destroy, :add_user, :all_users, :update_project_visibility].freeze
  OTHER_ACTIONS = [:create, :new, :index, :send_project_csv, :choose_project].freeze

  power :projects, map: { EDIT_ACTIONS => :updatable_projects }, as: :projects_scope

  before_action :admin_required, only: [:edit, :new]
  before_action :set_project, only: READ_ACTIONS + EDIT_ACTIONS
  before_action :assert_access, only: OTHER_ACTIONS
  before_action :check_access
  before_action :no_demo_user, only: [:create, :new]

  clear_respond_to
  respond_to :json

  # GET /projects
  # GET /projects.json
  def index
    @projects = current_power.projects
  end

  def choose_project
    project_search = current_power.updatable_projects.index_by(&:name).map do |name, record|
      { "title" => name,
        "description" => "",
        "project_id" => record.id }
    end
    render json: JSON.dump(project_search)
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
          background_flag: @project.background_flag.to_i,
          created_at: @project.created_at,
          total_sample_count: @samples.count
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
      project_name = project.cleaned_project_name
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
    safe_s3_rm(@project.report_tar_s3(user_id))
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
    safe_s3_cp(@project.report_tar_s3(user_id), output_file)
    send_file output_file
  end

  def make_host_gene_counts
    user_id = current_user.id
    safe_s3_rm(@project.host_gene_counts_tar_s3(user_id))
    params["user_id"] = user_id
    Resque.enqueue(HostGeneCounts, params)
    render json: { status_display: project_reports_progress_message }
  end

  def host_gene_counts_status
    final_complete = `aws s3 ls #{@project.host_gene_counts_tar_s3(current_user.id)} | wc -l`.to_i == 1
    if final_complete
      render json: { status_display: "complete" }
      return
    end
    render json: { status_display: project_reports_progress_message }
  end

  def send_host_gene_counts
    user_id = current_user.id
    output_file = @project.host_gene_counts_tar(user_id)
    safe_s3_cp(@project.host_gene_counts_tar_s3(user_id), output_file)
    send_file output_file
  end

  # GET /projects/new
  def new
    @project = Project.new
  end

  # GET /projects/1/edit
  def edit
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
    update_project_background
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
    deletable = Sample.where(project_id: @project.id).empty?
    @project.destroy if deletable
    respond_to do |format|
      if deletable
        format.html { redirect_to projects_url, notice: 'Project was successfully destroyed.' }
        format.json { head :no_content }
      else
        format.html { render :edit }
        format.json { render json: { message: 'Cannot delete this project' }, status: :unprocessable_entity }
      end
    end
  end

  def all_users
    render json: { users: @project.users.map { |user| { name: user[:name], email: user[:email] } } }
  end

  def add_user
    @user = User.find_by(email: params[:user_email_to_add])
    if @user
      UserMailer.added_to_projects_email(@user.id, shared_project_email_arguments).deliver_now unless @project.user_ids.include? @user.id
    else
      create_new_user_random_password(params[:user_name_to_add], params[:user_email_to_add])
    end
    @project.user_ids |= [@user.id]
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def create_new_user_random_password(name, email)
    user_params_with_password = { email: email, name: name }
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
    result = params.require(:project).permit(:name, :public_access, :background_flag, user_ids: [])
    result[:name] = sanitize(result[:name]) if result[:name]
    result
  end

  def update_project_background
    return unless project_params[:background_flag]
    if project_params[:background_flag].zero? && @project.background
      @project.background.destroy
    elsif project_params[:background_flag] == 1 && @project.results_complete?
      @project.create_or_update_project_background
    end
  end

  def project_reports_progress_message
    "In progress (project #{@project.name})"
  end
end
