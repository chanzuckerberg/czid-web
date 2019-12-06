
Rails.application.config.middleware.use Warden::Manager do |manager|
  manager.failure_app = proc { |_env| ['401', { 'Content-Type' => 'application/json' }, { error: 'Unauthorized', code: 401 }] }
end

Warden::Manager.serialize_into_session do |user|
  # convert to warden_session_obj
  user.slice("id", "role")
end

Warden::Manager.serialize_from_session do |warden_session_obj|
  User.find_by(id: warden_session_obj["id"],
               role: warden_session_obj["role"])
end

# TODO: DAVID - Put user login counters here
# https://github.com/wardencommunity/warden/wiki/Callbacks#after_authentication
