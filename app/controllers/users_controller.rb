class UsersController < ApplicationController
  skip_before_action :authenticate_user!, only: [:password_new]
  before_action :admin_required, except: [:password_new]
  before_action :set_user, only: [:show, :edit, :update, :destroy]

  # GET /users
  # GET /users.json
  def index
    @users = User.includes(:projects).all
  end

  # GET /users/new
  def new
    new_user
  end

  # POST /users
  # POST /users.json
  def create
    new_user_params = user_params.to_h.symbolize_keys
    new_user_params[:email].downcase!
    send_activation = new_user_params.delete(:send_activation)
    new_user(new_user_params)

    respond_to do |format|
      if @user.save
        # Create the user with Auth0.
        create_response = Auth0UserManagementHelper.create_auth0_user(**new_user_params.slice(:email, :name, :role))

        if send_activation
          # Get their password reset link so they can set a password.
          auth0_id = create_response["user_id"]
          reset_response = Auth0UserManagementHelper.get_auth0_password_reset_token(auth0_id)
          reset_url = reset_response["ticket"]

          # Send them an invitation and account activation email.
          email = new_user_params[:email]
          UserMailer.account_activation(email, reset_url).deliver_now
        end

        format.html { redirect_to edit_user_path(@user), notice: "User was successfully created" }
        format.json { render :show, status: :created, location: root_path }
      else
        format.html { render :new }
        format.json { render json: @user.errors.full_messages, status: :unprocessable_entity }
      end
    end
  rescue => err
    render json: [err], status: :unprocessable_entity
  end

  # GET /users/1/edit
  def edit
  end

  # PATCH/PUT /users/1
  # PATCH/PUT /users/1.json
  def update
    input_params = user_params.to_h.symbolize_keys
    if @user.update(input_params)
      # Update user info on Auth0.
      Auth0UserManagementHelper.patch_auth0_user(input_params.slice(:email, :name, :role))

      respond_to do |format|
        format.html { redirect_to edit_user_path(@user), notice: 'User was successfully updated.' }
        format.json { render :show, status: :ok, location: @user }
      end
    else
      respond_to do |format|
        format.html { render :edit }
        format.json { render json: @user.errors.full_messages, status: :unprocessable_entity }
      end
    end
  end

  # DELETE /users/1
  # DELETE /users/1.json
  def destroy
    @user.destroy!

    # Delete user from Auth0
    Auth0UserManagementHelper.delete_auth0_user(email: @user.email)

    respond_to do |format|
      format.html { redirect_to users_url, notice: 'User was successfully destroyed.' }
      format.json { head :no_content }
    end
  end

  # GET /users/password/new
  def password_new
    render 'password_new'
  end

  private

  # Use callbacks to share common setup or constraints between actions.
  def set_user
    @user ||= User.find(params[:id])
  end

  def new_user(attrs = {})
    @user ||= User.new(attrs)
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def user_params
    params.require(:user).permit(:role, :email, :institution, :name, :send_activation, project_ids: [])
  end
end
