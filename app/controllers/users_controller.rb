class UsersController < ApplicationController
  clear_respond_to
  respond_to :json
  before_action :admin_required, only: [:show, :edit, :update, :destroy, :new, :create, :index]
  before_action :set_user, only: [:show, :edit, :update, :destroy]

  # GET /users
  # GET /users.json
  def index
    @users = User.all
  end

  # GET /users/new
  def new
    new_user
  end

  # POST /users
  # POST /users.json
  def create
    new_user(user_params)

    respond_to do |format|
      if @user.save
        UserMailer.added_to_projects_email(@user, current_user, @user.projects).deliver_now
        @user.send_reset_password_instructions
        format.html { redirect_to edit_user_path(@user), notice: "User was successfully created" }
        format.json { render :show, status: :created, location: root_path }
      else
        format.html { render :new }
        format.json { render json: @user.errors, status: :unprocessable_entity }
      end
    end
  end

  # GET /users/1/edit
  def edit
  end

  # PATCH/PUT /users/1
  # PATCH/PUT /users/1.json
  def update
    respond_to do |format|
      input_params = user_params
      if input_params[:password] && input_params[:password] == ''
        input_params.delete(:password)
      end
      if input_params[:password_confirmation] && input_params[:password_confirmation] == ''
        input_params.delete(:password_confirmation)
      end
      if @user.update(input_params)
        format.html { redirect_to edit_user_path(@user), notice: 'User was successfully updated.' }
        format.json { render :show, status: :ok, location: @user }
      else
        format.html { render :edit }
        format.json { render json: @user.errors.full_messages, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /users/1
  # DELETE /users/1.json
  def destroy
    @user.destroy
    respond_to do |format|
      format.html { redirect_to users_url, notice: 'User was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  def add_user_to_project
    @user = User.find_by(email: params[:user_email_to_add])
    @project = Project.find(params[:project_id])
    create_new_user_random_password unless @user
    UserMailer.added_to_projects_email(@user, current_user, [@project]).deliver_now unless @project.user_ids.include? @user.id
    @project.user_ids |= [@user.id]
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_user
    @user ||= User.find(params[:id])
  end

  def new_user(attrs = {})
    @user ||= User.new(attrs)
  end

  def create_new_user_random_password(attrs = {})
    user_params_with_password = user_params
    if user_params_with_password[:password].nil?
      random_password = SecureRandom.hex(10)
      user_params_with_password[:password] = random_password
      user_params_with_password[:password_confirmation] = random_password
    end
    new_user(user_params_with_password)
    @user.save
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def user_params
    if current_user && current_user.admin
      params.require(:user).permit(:role, :email, :authentication_token, :password, :password_confirmation, :name, project_ids: [])
    else
      params.require(:user).permit(:email, :authentication_token, :password, :password_confirmation, :name, project_ids: [])
    end
  end
end
