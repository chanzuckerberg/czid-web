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
        # Don't rely on other sanitize methods that may miss HTML encoding.
        req.update_param(k, v.gsub(/[^0-9A-Za-z_]/, ''))
      end
    end

    @app.call(env)
  end
end
