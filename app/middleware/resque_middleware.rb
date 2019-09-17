class ResqueMiddleware
  CONTROLLER_INSTANCE = ActionController::Base.new

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

    status, headers, response = @app.call(env)
    puts "RESP 5:07pm: ", response, "END"

    if env['PATH_INFO'].start_with?("/resque")
      puts "INSIDE THE BLOCK 5:12pm"

      puts "CLASS: ", response.class, "END"
      puts "LEN: ", response.size

      begin
        doc = Nokogiri::HTML.parse(response[0])
        puts "The doc is: ", doc, "END"
        forms = doc.xpath("//form")
        puts "FORMS 5:51pm", forms, "END"
        puts "FORM COUNT #{forms.size}"
        puts "CLASS: ", forms.class

        req = Rack::Request.new(env)
        masked = CONTROLLER_INSTANCE.send(:masked_authenticity_token, req.session)
        puts "MASKED 12:06pm", masked

        forms.each do |form|
          form.add_child("<input type=\"hidden\" name=\"_csrf\" value=\"#{masked}\"/>")
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
