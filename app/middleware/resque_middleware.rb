class ResqueMiddleware
  # Separate controller instance to access RequestForgeryProtection methods
  BASE_CONTROLLER = ActionController::Base.new

  def initialize(app)
    @app = app
  end

  # CSRF reference: https://medium.com/rubyinside/a-deep-dive-into-csrf-protection-in-rails-19fa0a42c0ef
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

      # Expect actions to use a form submit with a _csrf hidden field.
      form_params = env["rack.request.form_hash"] || {}
      if form_params.key?("_csrf")
        valid_token = BASE_CONTROLLER.send(:valid_authenticity_token?, rack_session, form_params["_csrf"])
      end

      # Stop execution with invalid token
      unless valid_token
        raise ActionController::InvalidAuthenticityToken
      end
    end

    ### OUTPUT ADDITIONS

    # Get regular application response
    status, headers, response = @app.call(env)

    # Add a _csrf token to all Resque UI forms
    if response.is_a?(Array) && response.present?
      doc = Nokogiri::HTML.parse(response[0])

      # Masked token varies on each request but is valid for the session.
      masked_token = BASE_CONTROLLER.send(:masked_authenticity_token, rack_session)
      form_nodes = doc.xpath("//form")
      form_nodes.each do |form|
        form.prepend_child("<input type=\"hidden\" name=\"_csrf\" value=\"#{masked_token}\"/>")
      end
      response = [doc.to_s]
    end

    [status, headers, response]
  end
end
