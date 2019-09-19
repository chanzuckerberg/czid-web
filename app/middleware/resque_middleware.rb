class ResqueMiddleware
  BASE_CONTROLLER = ActionController::Base.new

  def initialize(app)
    @app = app
  end

  def call(env)
    # Regular execution for non-Resque paths
    unless env['PATH_INFO'].start_with?("/resque")
      return @app.call(env)
    end

    rack_request = Rack::Request.new(env)
    rack_session = rack_request.session

    ### INPUT VERIFICATION

    # Restrict allowed characters going to Resque server params.
    # update_param will modify the original 'env' object.
    rack_request.params.each do |k, v|
      # Don't rely on other sanitize methods that may miss HTML encoding.
      req.update_param(k, v.gsub(/[^0-9A-Za-z_]/, '')) unless k == "_csrf"
    end

    # Verify every request except GET and HEAD
    unless rack_request.get? || rack_request.head?
      valid_token = false

      # Expect state-changing actions to use a form submit with a _csrf hidden field.
      form_params = env["rack.request.form_hash"] || {}
      if form_params.key?("_csrf")
        valid_token = BASE_CONTROLLER.send(:valid_authenticity_token?, rack_session, form_params["_csrf"])
      end

      # Stop execution with invalid token
      unless valid_token
        raise ActionController::InvalidAuthenticityToken
      end
    end

    ### OUTPUT DECORATION

    # Get regular application response
    status, headers, response = @app.call(env)

    # Add a _csrf token to all Resque UI forms
    doc = Nokogiri::HTML.parse(response[0])
    form_nodes = doc.xpath("//form")
    masked_token = BASE_CONTROLLER.send(:masked_authenticity_token, rack_session)

    form_nodes.each do |form|
      form.prepend_child("<input type=\"hidden\" name=\"_csrf\" value=\"#{masked_token}\"/>")
    end
    response = [doc.to_s]

    [status, headers, response]
  end
end
