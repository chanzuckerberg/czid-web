
Rails.application.config.middleware.use Warden::Manager do |manager|
  manager.failure_app = proc { |_env| ['401', { 'Content-Type' => 'application/json' }, { error: 'Unauthorized', code: 401 }] }
end

Warden::Manager.serialize_into_session do |user|
  # convert to warden_session_obj
  serialized = user.slice("id", "role")
  # extra field to improve security
  serialized["authentication_token_hash"] = user["authentication_token"].hash
  serialized
end

Warden::Manager.serialize_from_session do |warden_session_obj|
  return nil unless warden_session_obj.instance_of?(Hash)
  id, role, authentication_token_hash = warden_session_obj.values_at("id", "role", "authentication_token_hash")
  user = User.find_by(id: id, role: role)
  if user && authentication_token_hash == user.authentication_token.hash
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
