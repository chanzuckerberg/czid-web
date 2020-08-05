require 'rails_helper'

RSpec.describe FrontendMetricsController, type: :controller do
  context "Instrumented frontend endpoint" do
    before do
      @user = create(:user)
      sign_in @user
    end

    describe "POST #create" do
      it "should return status 204 when given valid metric parameters from a url with a GET request" do
        mock_frontend_metric_params = {
          url: '/samples/123',
          response_time: 1000.0, # Milliseconds
          http_method: "get",
          http_status: 200,
        }
        post :create, params: mock_frontend_metric_params
        expect(response).to have_http_status(204)
      end

      it "should return status 204 when given valid metric parameters from a url with a POST request" do
        mock_frontend_metric_params = {
          url: '/samples/123/save_metadata_v2',
          response_time: 1000.0, # Milliseconds
          http_method: "post",
          http_status: 200,
        }
        post :create, params: mock_frontend_metric_params
        expect(response).to have_http_status(204)
      end

      it "should return status 204 when given valid metric parameters from a url with a PUT request" do
        mock_frontend_metric_params = {
          url: '/projects/123.json',
          response_time: 1000.0, # Milliseconds
          http_method: "put",
          http_status: 200,
        }
        post :create, params: mock_frontend_metric_params
        expect(response).to have_http_status(204)
      end

      it "should return status 204 when given valid metric parameters from a url with a DELETE request" do
        mock_frontend_metric_params = {
          url: '/samples/123.json',
          response_time: 1000.0, # Milliseconds
          http_method: "delete",
          http_status: 200,
        }
        post :create, params: mock_frontend_metric_params
        expect(response).to have_http_status(204)
      end

      it "should return 400 status when http method for url does not exist" do
        mock_frontend_metric_params = {
          url: '/visualizations.json',
          response_time: 1000.0, # Milliseconds
          http_method: "delete",
          http_status: 404,
        }
        post :create, params: mock_frontend_metric_params

        expect(response).to have_http_status(400)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to eq("No route matches '#{mock_frontend_metric_params[:url]}' with http method '#{mock_frontend_metric_params[:http_method]}'")
      end

      it "should return 400 status when missing some metric parameters" do
        post :create, params: { url: '/some/endpoint' }

        expect(response).to have_http_status(400)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to include("Provided invalid parameters")
      end

      it "should return 400 status when parameters are empty" do
        mock_frontend_metric_params = {}
        post :create, params: mock_frontend_metric_params

        expect(response).to have_http_status(400)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to include("Provided invalid parameters")
      end

      it "should return 400 status when url is empty" do
        mock_frontend_metric_params = {
          url: "",
        }
        post :create, params: mock_frontend_metric_params

        expect(response).to have_http_status(400)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to include("Provided invalid parameters")
      end

      it "should return 400 status when response_time can't be converted to Float" do
        mock_frontend_metric_params = {
          url: "/samples/123",
          response_time: "invalid response time",
          http_method: "get",
          http_status: 404,
        }
        post :create, params: mock_frontend_metric_params

        expect(response).to have_http_status(400)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to include("Provided invalid parameters")
      end

      it "should return 400 status when http method does not exist" do
        mock_frontend_metric_params = {
          url: "/samples/123",
          response_time: 1000.0,
          http_method: "invalid http method",
          http_status: 404,
        }
        post :create, params: mock_frontend_metric_params

        expect(response).to have_http_status(400)
        json_response = JSON.parse(response.body)
        expect(json_response["error"]).to include("Provided invalid parameters")
      end
    end
  end
end
