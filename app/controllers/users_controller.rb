class UsersController < ApplicationController
  clear_respond_to
  respond_to :json
  before_action :set_user, only: [:show, :edit, :destroy]
  acts_as_token_authentication_handler_for User, only: [:create, :update], fallback: :devise

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
    Rails.logger.debug(user_params.inspect)
    new_user(user_params)

    respond_to do |format|
      if @new_user.save
        format.html { redirect_to edit_user_path(@new_user), notice: 'User was successfully created.' }
        format.json { render :show, status: :created, location: root_path }
      else
        format.html { render :new }
        format.json { render json: @new_user.errors, status: :unprocessable_entity }
      end
    end
  end

  # GET /users/1/edit
  def edit
  end

  # PATCH/PUT /users/1
  # PATCH/PUT /users/1.json
  def update
    @user_to_update ||= User.find(params[:id])
    respond_to do |format|
      input_params = user_params
      if input_params[:password] && input_params[:password] == ''
        input_params.delete(:password)
      end
      if input_params[:password_confirmation] && input_params[:password_confirmation] == ''
        input_params.delete(:password_confirmation)
      end
      if @user_to_update.update(input_params)
        format.html { redirect_to edit_user_path(@user_to_update), notice: 'User was successfully updated.' }
        format.json { render :show, status: :ok, location: @user_to_update }
      else
        format.html { render :edit }
        format.json { render json: @user_to_update.errors.full_messages, status: :unprocessable_entity }
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

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_user
    @user ||= User.find(params[:id])
  end

  def new_user(attrs = {})
    @new_user ||= User.new(attrs)
  end

  def valid_role_assignment(params)
    # Only allow request to set user role if authenticated as admin user
    params[:role] && @user && @user.role == User::ROLE_ADMIN
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def user_params
    return_params = params.require(:user).permit(:email, :authentication_token, :password, :password_confirmation, :name, project_ids: [])
    return_params[:role] = params[:role] if valid_role_assignment(params)
    return_params
  end
end
