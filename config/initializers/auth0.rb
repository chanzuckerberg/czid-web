require 'digest/sha1'

# Replaced with Basic Auth in ApplicationController for preview purposes.
# Rails.application.config.middleware.use Warden::Manager do |manager|
#   manager.failure_app = proc { |_env| ['401', { 'Content-Type' => 'application/json' }, { error: 'Unauthorized', code: 401 }] }
# end

Warden::Manager.serialize_into_session do |user|
  # convert to warden_session_obj
  serialized = user.slice("id", "role")
  # extra field to improve security
  serialized["authentication_token_hash"] = Digest::SHA1.hexdigest(user["authentication_token"] || "")
  serialized
end

Warden::Manager.serialize_from_session do |warden_session_obj|
  return nil unless warden_session_obj.instance_of?(Hash)
  id, role, authentication_token_hash = warden_session_obj.values_at("id", "role", "authentication_token_hash")
  user = User.find_by(id: id, role: role)
  if user && authentication_token_hash == Digest::SHA1.hexdigest(user.authentication_token || "")
    user
  end
end

# This code provides routing mapper to authenticate routes
# ex:
# -- routes.rb --
#   authenticate :user, ->(u) { u.admin? } do
#     mount RESQUE_SERVER, at: "/resque"
#   end
module ActionDispatch::Routing
  class Mapper
    def authenticate(scope = nil, block = nil)
      constraint = lambda do |request|
        request.env['warden'].authenticated?(scope) && (block.nil? || block.call(request.env['warden'].user(scope)))
      end
      constraints(constraint) do
        yield
      end
    end
  end
end

Rails.application.config.middleware.use OmniAuth::Builder do
  provider(
    :auth0,
    ENV["AUTH0_CLIENT_ID"],
    ENV["AUTH0_CLIENT_SECRET"],
    ENV["AUTH0_DOMAIN"],
    callback_path: '/auth/auth0/callback',
    authorize_params: {
      scope: 'openid email',
    }
  )
end

OmniAuth.config.failure_raise_out_environments = []

OmniAuth.config.on_failure = proc do |env|
  Auth0Controller.action(:omniauth_failure).call(env)
end
