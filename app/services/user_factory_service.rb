class UserFactoryService
  include Callable
  attr_accessor :auth0_user_id, :current_user, :new_user, :new_user_params,
                :project_id, :send_activation, :signup_path

  def initialize(
    email:,
    name: nil,
    current_user: nil,
    project_id: nil,
    send_activation: false,
    signup_path: nil,
    created_by_user_id: nil,
    **other_user_attrs
  )
    @project_id = project_id
    @send_activation = send_activation
    @signup_path = signup_path
    @new_user_params = {
      email: email.downcase,
      name: name,
      created_by_user_id: created_by_user_id,
      **other_user_attrs,
    }
    @current_user = current_user
  end

  def call
    ActiveRecord::Base.transaction do
      @new_user = User.create!(**new_user_params)
      create_auth0_user_and_save_user_id
    end

    record_new_user_in_airtable
    send_activation_email if send_activation

    new_user
  rescue ActiveRecord::RecordInvalid => err
    LogUtil.log_error(
      "Failed to create user: #{err.message}",
      exception: err,
      user_params: new_user_params
    )
    # re-raise error for awareness to callers
    raise
  end

  private

  def record_new_user_in_airtable
    table_name = "CZ ID Accounts"
    data = {
      fields: {
        userId: new_user.id,
        signupPath: signup_path,
      },
    }
    MetricUtil.post_to_airtable(table_name, data.to_json)
  rescue StandardError => err
    LogUtil.log_error(
      "Error when recording new user in AirTable",
      exception: err,
      table_name: table_name,
      data: data
    )
  end

  def create_auth0_user_and_save_user_id
    auth0_response = Auth0UserManagementHelper.create_auth0_user(**new_user.slice(:email, :name, :role).symbolize_keys)
    @auth0_user_id = auth0_response["user_id"]
  rescue StandardError => err
    LogUtil.log_error(
      "Error when creating user in Auth0",
      exception: err,
      user_params: new_user.slice(:email, :name, :role)
    )
    raise
  end

  def send_activation_email
    reset_response = Auth0UserManagementHelper.get_auth0_password_reset_token(auth0_user_id)
    reset_url = reset_response["ticket"]

    # Send them an invitation and account activation email.
    email_message = if project_id
                      UserMailer.new_auth0_user_new_project(
                        current_user,
                        new_user.email,
                        project_id,
                        reset_url
                      )
                    else
                      UserMailer.account_activation(new_user.email, reset_url)
                    end
    email_message.deliver_now
  rescue Net::SMTPAuthenticationError => err
    LogUtil.log_error(
      "Error when sending account notification email to user.",
      exception: err,
      user_email: new_user.email
    )
    # re-raise error for awareness to callers
    raise
  end
end
