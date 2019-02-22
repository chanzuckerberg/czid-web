class ProjectsController < ApplicationController
  include ApplicationHelper
  include SamplesHelper
  include ReportHelper
  include MetadataHelper
  ########################################
  # Note to developers:
  # If you are adding a new action to the project controller, you must classify your action into
  # READ_ACTIONS: where current_user has read access of the project
  # EDIT_ACTIONS: where current_user has update access of the project
  # OTHER_ACTIONS: where the actions access multiple projects or non-existing projects.
  #                access control should still be checked as neccessary through current_power
  #
  ##########################################

  READ_ACTIONS = [
    :show, :add_favorite, :remove_favorite, :make_host_gene_counts, :host_gene_counts_status,
    :send_host_gene_counts, :make_project_reports_csv, :project_reports_csv_status,
    :send_project_reports_csv, :validate_metadata_csv, :upload_metadata,
    :validate_sample_names
  ].freeze
  EDIT_ACTIONS = [:edit, :update, :destroy, :add_user, :all_users, :update_project_visibility].freeze
  OTHER_ACTIONS = [:create, :new, :index, :send_project_csv, :choose_project].freeze

  # Required for token auth for CLI actions
  skip_before_action :verify_authenticity_token, only: [:index, :create]
  before_action :authenticate_user!, except: [:index, :create]
  acts_as_token_authentication_handler_for User, only: [:index, :create], fallback: :devise
  current_power do
    Power.new(current_user)
  end

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
    puts "index was called at least"
    respond_to do |format|
      format.html do
        # keep compatibility with old route
        # TODO: remove once data discovery is completed
        @projects = current_power.projects
      end
      format.json do
        only_updatable = ActiveModel::Type::Boolean.new.cast(params[:onlyUpdatable])

        # TODO(mark): Reconcile this with the part below.
        # These returned projects contain different fields than the ones below.
        if only_updatable
          render json: current_power.updatable_projects
          return
        end

        puts "got up to here at least"

        only_library = ActiveModel::Type::Boolean.new.cast(params[:onlyLibrary])
        exclude_library = ActiveModel::Type::Boolean.new.cast(params[:excludeLibrary])

        @samples = if only_library
                     current_power.library_samples
                   elsif exclude_library
                     Sample.public_samples
                   else
                     current_power.samples
                   end

        @projects = if only_library || exclude_library
                      @samples.group(:project).count
                    else
                      # This check is so that we still return projects without any samples.
                      # Ex: Project listing used by the CLI.
                      current_power.projects.map { |p| [p, Sample.where(project: p).count] }
                    end
        extended_projects = @projects.map do |project, sample_count|
          project.as_json(only: [:id, :name, :created_at, :public_access]).merge(
            number_of_samples: sample_count,
            hosts: @samples.where(project_id: project.id).includes(:host_genome).distinct.pluck("host_genomes.name").compact,
            tissues: @samples.where(project_id: project.id).distinct.pluck(:sample_tissue).compact
          )
        end
        render json: extended_projects
      end
    end
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
    @samples = current_power.project_samples(@project).order(id: :desc)
    # all exisiting project are null, we ensure private projects are explicitly set to 0
    respond_to do |format|
      format.html
      format.json do
        render json: {
          id: @project.id,
          name: @project.name,
          public_access: @project.public_access.to_i,
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
    Syscall.s3_rm(@project.report_tar_s3(user_id))
    params["user_id"] = user_id
    Resque.enqueue(GenerateProjectReportsCsv, params)
    render json: { status_display: project_reports_progress_message }
  end

  def project_reports_csv_status
    stdout = Syscall.pipe(["aws", "s3", "ls", @project.report_tar_s3(current_user.id)], ["wc", "-l"])
    return if stdout.blank?
    final_complete = stdout.to_i == 1
    if final_complete
      render json: { status_display: "complete" }
      return
    end
    render json: { status_display: project_reports_progress_message }
  end

  def send_project_reports_csv
    user_id = current_user.id
    output_file = @project.report_tar(user_id)
    Syscall.s3_cp(@project.report_tar_s3(user_id), output_file)
    send_file output_file
  end

  def make_host_gene_counts
    user_id = current_user.id
    Syscall.s3_rm(@project.host_gene_counts_tar_s3(user_id))
    params["user_id"] = user_id
    Resque.enqueue(HostGeneCounts, params)
    render json: { status_display: project_reports_progress_message }
  end

  def host_gene_counts_status
    stdout = Syscall.pipe(["aws", "s3", "ls", @project.host_gene_counts_tar_s3(current_user.id)], ["wc", "-l"])
    return if stdout.blank?
    final_complete = stdout.to_i == 1
    if final_complete
      render json: { status_display: "complete" }
      return
    end
    render json: { status_display: project_reports_progress_message }
  end

  def send_host_gene_counts
    user_id = current_user.id
    output_file = @project.host_gene_counts_tar(user_id)
    Syscall.s3_cp(@project.host_gene_counts_tar_s3(user_id), output_file)
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
    # New projects get the current set of default fields
    @project.metadata_fields << MetadataField.where(is_default: 1)

    respond_to do |format|
      if @project.save
        # Send to Datadog
        # TODO: Replace with Segment
        tags = %W[project_id:#{@project.id} user_id:#{current_user.id}]
        MetricUtil.put_metric_now("projects.created", 1, tags)

        # Send to Segment
        event = MetricUtil::ANALYTICS_EVENT_NAMES[:project_created]
        MetricUtil.log_analytics_event(event, current_user, id: @project.id)

        format.html { redirect_to @project, notice: 'Project was successfully created.' }
        format.json { render :show, status: :created, location: @project, project: @project }
      else
        format.html { render :new }
        format.json { render json: @project.errors.full_messages, status: :unprocessable_entity }
      end
    end
  rescue ActiveRecord::RecordNotUnique
    respond_to do |format|
      format.html {}
      format.json do
        render json: "Duplicate name",
               status: :unprocessable_entity
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

  def validate_metadata_csv
    metadata = params[:metadata]

    project_samples = current_power.project_samples(@project)
    issues = validate_metadata_csv_for_samples(project_samples.to_a, metadata)
    render json: {
      status: "success",
      issues: issues
    }
  end

  def upload_metadata
    metadata = params[:metadata]

    project_samples = current_power.project_samples(@project)

    errors = upload_metadata_for_samples(project_samples.to_a, metadata)
    render json: {
      status: "success",
      errors: errors
    }
  end

  # TODO: Consider consolidating into a general sample validator
  # Takes an array of sample names.
  # Returns an array of sample names that has no name collisions with existing samples or with each other.
  def validate_sample_names
    sample_names = params[:sample_names]
    new_sample_names = []

    existing_names = Sample.where(project: @project).pluck(:name)

    sample_names.each do |sample_name|
      i = 0
      cur_sample_name = sample_name

      # If the sample name already exists in the project, add a _1, _2, _3, etc.
      while existing_names.include?(cur_sample_name)
        i += 1
        cur_sample_name = sample_name + "_#{i}"
      end

      new_sample_names << cur_sample_name
      # Add the validated sample name to existing names, so subsequent names don't collide.
      existing_names << cur_sample_name
    end

    render json: new_sample_names
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def create_new_user_random_password(name, email)
    user_params_with_password = { email: email, name: name }
    random_password = SecureRandom.hex(10)
    user_params_with_password[:password] = random_password
    user_params_with_password[:password_confirmation] = random_password
    @user ||= User.new(user_params_with_password)
    @user.email_arguments = new_user_shared_project_email_arguments()
    @user.send_reset_password_instructions if @user.save
  end

  def new_user_shared_project_email_arguments
    {
      email_subject: 'You have been invited to IDseq',
      email_template: 'new_user_new_project',
      sharing_user_id: current_user.id,
      shared_project_id: @project.id
    }
  end

  def shared_project_email_arguments
    {
      email_subject: 'You have been added to a project on IDseq',
      sharing_user_id: current_user.id,
      shared_project_id: @project.id
    }
  end

  def set_project
    puts "why is set_project being called"
    @project = projects_scope.find(params[:id])
    assert_access
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def project_params
    puts "original params here #{params}"
    result = params.require(:project).permit(:name, :public_access, user_ids: [])
    result[:name] = sanitize(result[:name]) if result[:name]
    result
  end

  def project_reports_progress_message
    "In progress (project #{@project.name})"
  end
end
