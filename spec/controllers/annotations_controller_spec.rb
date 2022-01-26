require 'rails_helper'

RSpec.describe AnnotationsController, type: :controller do
  before do
    @user = create(:user)
    @unauthorized_user = create(:user)
    project = create(:project, users: [@user], creator: @user)
    sample = create(:sample,
                    project: project,
                    pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
    @pipeline_run = create(:pipeline_run, sample: sample)
    @species_a = create(:taxon_lineage, tax_name: "species a", taxid: 1)
  end

  describe "POST #create" do
    it "should return unauthorized if the user doesn't have edit access to the sample" do
      @unauthorized_user.add_allowed_feature("annotation")
      sign_in @unauthorized_user

      post :create, params: { pipeline_run_id: @pipeline_run.id, tax_id: @species_a.taxid, content: "hit" }
      expect(response).to have_http_status(:unauthorized)
      json_response = JSON.parse(response.body)
      expect(json_response["error"]).to eq("You are not authorized to create annotations.")
    end

    it "should create a new annotation if the user has edit access to the sample" do
      @user.add_allowed_feature("annotation")
      sign_in @user

      expect do
        post :create, params: { pipeline_run_id: @pipeline_run.id, tax_id: @species_a.taxid, content: "hit" }
      end.to change(Annotation, :count).by(1)

      new_annotation = Annotation.last
      expect(new_annotation["pipeline_run_id"]).to eq(@pipeline_run.id)
      expect(new_annotation["tax_id"]).to eq(@species_a.taxid)
      expect(new_annotation["content"]).to eq("hit")

      expect(response).to have_http_status(:ok)
    end

    it "should raise an error if the pipeline run doesn't exist" do
      @user.add_allowed_feature("annotation")
      sign_in @user

      nonexistent_pipeline_run_id = @pipeline_run.id + 1
      post :create, params: { pipeline_run_id: nonexistent_pipeline_run_id, tax_id: @species_a.taxid, content: "hit" }
      expect(response).to have_http_status(:internal_server_error)
    end

    it "should raise an error if the annotation content is invalid" do
      @user.add_allowed_feature("annotation")
      sign_in @user

      post :create, params: { pipeline_run_id: @pipeline_run.id, tax_id: @species_a.taxid, content: "invalid_content" }
      expect(response).to have_http_status(:internal_server_error)
    end
  end
end
