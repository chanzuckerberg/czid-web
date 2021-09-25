require "rails_helper"

RSpec.describe GraphqlController, type: :request do
  create_users

  before do
    sign_in @admin
  end

  describe "POST graphql" do
    it "calls IdseqSchema" do
      expect(IdseqSchema).to receive(:execute).and_call_original
      expect(AppConfig).to receive(:find).with("1")

      post "/graphql", params: { query: "{
        appConfig(id: 1) {
          key
          value
        }
      }" }

      expect(response).to have_http_status(200)
    end
  end
end
