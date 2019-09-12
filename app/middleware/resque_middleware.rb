class ResqueMiddleware
  def initialize(app)
    @app = app
  end

  def call(env)
    # Restrict allowed characters going to Resque server params.
    # update_param will modify the original 'env' object.
    if env['PATH_INFO'].start_with?("/resque")
      req = Rack::Request.new(env)
      req.params.each do |k, v|
        req.update_param(k, v.gsub(/[^0-9A-Za-z_]/i, ''))
      end
    end

    @app.call(env)
  end
end
