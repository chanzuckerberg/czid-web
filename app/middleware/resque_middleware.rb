class ResqueMiddleware
  BASE_CONTROLLER = ActionController::Base.new

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

      post_params = req.body.read
      if post_params.present?
        key, value = post_params.split("=")
        value = URI.unescape(value)
        puts "post params 2:02pm: ", key, " = ", value, "END"

        result = BASE_CONTROLLER.send(:valid_authenticity_token?, req.session, value)
        puts "RESULT 2:25pm: ", result
      end
    end

    status, headers, response = @app.call(env)

    if env['PATH_INFO'].start_with?("/resque")
      begin
        doc = Nokogiri::HTML.parse(response[0])
        forms = doc.xpath("//form")

        req = Rack::Request.new(env)
        masked = BASE_CONTROLLER.send(:masked_authenticity_token, req.session)

        forms.each do |form|
          form.prepend_child("<input type=\"hidden\" name=\"_csrf\" value=\"#{masked}\"/>")
        end

        response = [doc.to_s]
      rescue => err
        puts "ERROR 5:40pm: "
        puts err.message
      end
    end

    [status, headers, response]
  end
end
