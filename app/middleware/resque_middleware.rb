class ResqueMiddleware
  BASE_CONTROLLER = ActionController::Base.new

  def initialize(app)
    @app = app
  end

  def call(env)
    # Restrict allowed characters going to Resque server params.
    # update_param will modify the original 'env' object.
    is_resque = env['PATH_INFO'].start_with?("/resque")

    if is_resque
      req = Rack::Request.new(env)
      req.params.each do |k, v|
        # Don't rely on other sanitize methods that may miss HTML encoding.
        # req.update_param(k, v.gsub(/[^0-9A-Za-z_]/, ''))

        # Replace this with only the vulnerable fields?
      end

      post_params = env["rack.request.form_hash"] || {}
      puts "POST PARAMS: ", post_params
      if post_params.key?("_csrf")
        value = post_params["_csrf"]
        puts "We got: ", value
        result = BASE_CONTROLLER.send(:valid_authenticity_token?, req.session, value)
        puts "VALID? ", result
      end
    end

    puts "BEFORE: ", env['PATH_INFO']

    status, headers, response = @app.call(env)

    puts "PATH INFO: ", env['PATH_INFO']
    if is_resque
      begin
        puts "I am in begin block"
        doc = Nokogiri::HTML.parse(response[0])
        forms = doc.xpath("//form")

        req = Rack::Request.new(env)
        masked = BASE_CONTROLLER.send(:masked_authenticity_token, req.session)

        forms.each do |form|
          puts "I am prepending 12:34pm"
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
