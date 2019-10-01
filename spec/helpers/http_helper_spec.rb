require "rails_helper"
require "webmock/rspec"

RSpec.describe HttpHelper, type: :helper do
  describe "#get" do
    context "#a successful HTTP request" do
      before do
        stub_request(:get, "https://www.example.com")
          .with(query: { "param_one" => "a" })
          .to_return(body: { "foo" => "bar" }.to_json)
      end

      def make_get_request
        HttpHelper.get_json("https://www.example.com", {
                              "param_one" => "a",
                            }, "Authorization" => "Bearer abc")
      end

      it "properly parses the response body" do
        response = make_get_request()

        expect(response).to include_json("foo" => "bar")
      end

      it "sends an HTTP get request with the correct headers and params" do
        make_get_request()

        expect(
          a_request(:get, "https://www.example.com")
            .with(headers: { "Authorization" => "Bearer abc" }, query: { "param_one" => "a" })
        ).to have_been_made
      end
    end

    context "#a failed HTTP request" do
      before do
        stub_request(:get, "https://www.example.com")
          .to_return(status: 401)
      end

      it "returns nil on errors" do
        expect do
          HttpHelper.get_json("https://www.example.com", {}, {})
        end.to raise_error(HttpHelper::HttpError)
      end
    end

    context "#an HTTP response with invalid JSON" do
      before do
        stub_request(:get, "https://www.example.com")
          .to_return(body: "abc")
      end

      it "returns nil on invalid JSON" do
        expect do
          HttpHelper.get_json("https://www.example.com", {}, {})
        end.to raise_error(JSON::ParserError)
      end
    end
  end

  describe "#post" do
    context "#a successful HTTP request" do
      before do
        stub_request(:post, "https://www.example.com")
          .with(body: {
                  "param_one" => "a",
                })
          .to_return(body: { "foo" => "bar" }.to_json)
      end

      def make_post_request
        HttpHelper.post_json("https://www.example.com", "param_one" => "a")
      end

      it "properly parses the response body" do
        response = make_post_request()

        expect(response).to include_json("foo" => "bar")
      end

      it "sends an HTTP post request with the correct body" do
        make_post_request()

        expect(
          a_request(:post, "https://www.example.com")
            .with(body: { "param_one" => "a" })
        ).to have_been_made
      end
    end

    context "#an HTTP response with invalid JSON" do
      before do
        stub_request(:post, "https://www.example.com")
          .to_return(body: "abc")
      end

      it "returns nil on invalid JSON" do
        expect do
          HttpHelper.post_json("https://www.example.com", {})
        end.to raise_error(JSON::ParserError)
      end
    end
  end
end
