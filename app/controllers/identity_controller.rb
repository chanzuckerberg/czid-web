class IdentityController < ApplicationController
  before_action :login_required, only: [:identify]
  before_action :admin_required, only: [:enrich_token_for_admin]
  skip_before_action :authenticate_user!, only: [:enrich_token, :impersonate]

  TOKEN_AUTH_SERVICE = "scripts/token_auth.py".freeze

  class TokenCreationError < StandardError
    def initialize(error = "")
      msg = "Invalid token received"
      msg += "Error: #{error}" if error.present?
      super(msg)
    end
  end

  class InvalidTokenError < StandardError
    def initialize(error = "")
      msg = "Invalid token received"
      msg += "Error: #{error}" if error.present?
      super(msg)
    end
  end

  class ExpiredTokenReceivedError < StandardError
    def initialize
      super("Expired token received")
    end
  end

  class TokenNotFoundError < StandardError
    def initialize
      super("Token not found. Please ensure you have a token when making a request.")
    end
  end

  class InvalidAuthorizationScheme < StandardError
    def initialize
      super("Invalid Authorization scheme provided. Please use Bearer.")
    end
  end

  class InsufficientPrivilegesError < StandardError
    def initialize
      super("Error: Insufficient privileges to perform this action")
    end
  end

  class UserNotFoundError < StandardError
    def initialize
      super("Error: User not found")
    end
  end

  def identify
    token = TokenCreationService.call(user_id: current_user.id)
    token_value = token["token"]
    expires_at = Time.zone.at(token["expires_at"])

    cookies[:czid_services_token] = {
      value: token_value,
      expires: expires_at,
    }

    render json: { token_value: token_value, expires_at: expires_at }, status: :ok
  end

  def enrich_token
    user_id, = validate_token

    # Enrich the token with project roles & return it as payload
    enriched_token = TokenCreationService.call(user_id: user_id, should_include_project_claims: true)
    render json: {
      token: enriched_token["token"],
    }, status: :ok
  end

  def impersonate
    _, decrypted_token = validate_token
    permitted_params = params.permit(:user_id)
    user_id = permitted_params[:user_id]&.to_i

    service_identity = decrypted_token["service_identity"]
    raise InsufficientPrivilegesError if service_identity.blank?
    raise UserNotFoundError unless User.exists?(user_id)

    # Enrich the token with project roles & the same service identity & return it as payload
    enriched_token = TokenCreationService.call(user_id: user_id, should_include_project_claims: true, service_identity: service_identity)
    render json: {
      token: enriched_token["token"],
    }, status: :ok
  end

  def enrich_token_for_admin
    permitted_params = params.permit(:user_id)
    user_id = permitted_params[:user_id]&.to_i

    # Enrich the token with project roles & return it as payload
    enriched_token = TokenCreationService.call(user_id: user_id, should_include_project_claims: true)
    render json: {
      token: enriched_token["token"],
    }, status: :ok
  end

  private

  # Fetches the token & validates it. Returns the user_id if valid.
  def validate_token
    # Get the current token from the Authorization header
    authorization_scheme, encrypted_token = request.authorization&.split(" ")
    raise TokenNotFoundError if encrypted_token.blank?
    raise InvalidAuthorizationScheme unless authorization_scheme == "Bearer"

    # Decrypt the token
    decrypted_token = decrypt_token(encrypted_token)
    user_id, expires = decrypted_token.values_at("sub", "exp")

    # Check if the token is expired
    token_expiration_time = Time.zone.at(expires)
    current_time = Time.zone.now
    if token_expiration_time < current_time
      raise ExpiredTokenReceivedError
    end

    [user_id, decrypted_token]
  end

  def decrypt_token(token)
    stdout, stderr, status = Open3.capture3(
      "python3", TOKEN_AUTH_SERVICE, "--decrypt_token",
      "--token", token
    )

    unless status.success?
      LogUtil.log_error(InvalidTokenError.new(stderr))
      raise InvalidTokenError
    end

    JSON.parse(stdout)
  end
end
