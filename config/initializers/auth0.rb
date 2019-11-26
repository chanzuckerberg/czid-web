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
