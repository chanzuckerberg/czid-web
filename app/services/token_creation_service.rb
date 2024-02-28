# Use the TokenCreationService to generate a token to communicate with GraphQL Fed Server & NextGen services
class TokenCreationService
  include Callable

  FIVE_MINUTES_IN_SECONDS = 300

  def initialize(user_id: nil, should_include_project_claims: false, service_identity: nil, expires_after: FIVE_MINUTES_IN_SECONDS)
    @user_id = User.find(user_id).id.to_s if user_id.present?
    @should_include_project_claims = should_include_project_claims
    @service_identity = service_identity
    @expires_after = expires_after
  end

  def call
    project_claims = @should_include_project_claims && @user_id ? user_project_access(@user_id) : nil
    generate_token(@user_id, project_claims, @service_identity, @expires_after)
  end

  private

  def generate_token(user_id, project_claims, service_identity, expires_after)
    # Verify the user_id provided is valid before generating a token
    user_id = user_id
    cmd = "python3 #{IdentityController::TOKEN_AUTH_SERVICE} --create_token"
    cmd += " --userid #{user_id}" if user_id.present?
    cmd += " --project-claims '#{project_claims.to_json}'" if project_claims.present?
    cmd += " --service-identity #{service_identity}" if service_identity.present?
    cmd += " --expiration #{expires_after}" # takes in seconds
    stdout, stderr, status = Open3.capture3(cmd)

    unless status.success?
      LogUtil.log_error(IdentityController::TokenCreationError.new(stderr))
      raise IdentityController::TokenCreationError
    end

    JSON.parse(stdout)
  end

  def user_project_access(user_id)
    # There are 3 levels of access in a project:
    # 1. Project owner - the user created the project. A project can only have owner
    # 2. Project member - the user is a member of the project. A project can have many members.
    # 3. Project viewer - the user can view the project. All users can view public projects.

    user = User.find(user_id)
    project_roles = {}
    project_roles["owner"] = Project.where(creator_id: user.id).pluck(:id)
    project_roles["member"] = Project.editable(user).pluck(:id)
    project_roles["viewer"] = Project.viewable(user).pluck(:id)

    project_roles
  end
end
