require 'rails_helper'

describe ResqueMiddleware do
  let(:app) { ->(env) { [200, env, ["<form></form>"]] } }

  let :middleware do
    ResqueMiddleware.new(app)
  end

  let(:fake_csrf_token) { "p4EN+dyvGnvjq2p6XOe0lzlTmQukZABJYxIh6djSKqg=" }
  let(:fake_masked_csrf_token) { "hBzahlIBUy+Y8EClFgmVlz7ptFlGkV7vt7+pAgqmjlgjndd/jq5JVHtbKt9K7iEAB7otUuL1XqbUrYjr0nSk8A==" }

  it "does not try to handle non-Resque requests" do
    expect(middleware).not_to receive(:handle_resque_request)

    ["/", "/samples", "/resq"].each do |p|
      env = Rack::MockRequest.env_for(p)
      middleware.call(env)
    end
  end

  it "handles Resque endpoint requests" do
    expect(middleware).to receive(:handle_resque_request).exactly(2).times

    env = Rack::MockRequest.env_for("/resque")
    middleware.call(env)

    env = Rack::MockRequest.env_for("/resque/failed")
    middleware.call(env)
  end

  it "raises exception on form submissions with missing CSRF token" do
    expect do
      env = Rack::MockRequest.env_for("/resque/failed", method: "POST")
      middleware.call(env)
    end.to raise_error(ActionController::InvalidAuthenticityToken)
  end

  it "raises exception on form submissions with invalid CSRF token" do
    expect do
      env = Rack::MockRequest.env_for("/resque/failed", method: "POST")
      rack_request = Rack::Request.new(env)
      rack_session = rack_request.session

      rack_session[:_csrf_token] = fake_csrf_token
      rack_request.update_param("_csrf", "invalid")
      env["rack.request.form_hash"] = { "_csrf" => "invalid" }

      middleware.handle_input(env, rack_session, rack_request)
    end.to raise_error(ActionController::InvalidAuthenticityToken)
  end

  it "allows form submissions with valid CSRF token" do
    env = Rack::MockRequest.env_for("/resque/failed", method: "POST")
    rack_request = Rack::Request.new(env)
    rack_session = rack_request.session

    rack_session[:_csrf_token] = fake_csrf_token
    rack_request.update_param("_csrf", fake_masked_csrf_token)
    env["rack.request.form_hash"] = { "_csrf" => fake_masked_csrf_token }

    middleware.handle_input(env, rack_session, rack_request)
  end

  it "adds a CSRF token to HTML forms" do
    env = Rack::MockRequest.env_for("/resque/failed")
    _status, _headers, response = middleware.call(env)
    expect(response[0]).to include('input type="hidden" name="_csrf"')
  end
end
