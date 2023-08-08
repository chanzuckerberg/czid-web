class Mutations::CreateUser < Mutations::BaseMutation
  include GraphqlAuthHelpers

  field :email, String, null: true

  def resolve(email:)
    auto_account_creation_enabled = AppConfigHelper.get_app_config(AppConfig::AUTO_ACCOUNT_CREATION_V1) == "1"

    if !current_user_is_logged_in?(context) && auto_account_creation_enabled
      existing_user = User.find_by(email: email)
      if existing_user
        raise GraphQL::ExecutionError, "Email has already been taken"
      end

      @user = UserFactoryService.call(
        email: email,
        role: User::ROLE_REGULAR_USER,
        send_activation: true,
        signup_path: User::SIGNUP_PATH[:self_registered]
      )
    else
      raise GraphQL::ExecutionError, "Permission denied"
    end
  end
end
