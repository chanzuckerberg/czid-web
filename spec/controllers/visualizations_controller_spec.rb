require 'rails_helper'

RSpec.describe VisualizationsController, type: :controller do
  create_users

  context "Joe" do
    before do
      sign_in @joe
      project = create(:project)
      sample_one = create(:sample, project: project)
      sample_two = create(:sample, project: project)
      deprecated_phylo_tree_ng = create(:phylo_tree_ng, deprecated: true)
      @visualization_one = create(:visualization, user_id: @joe.id, visualization_type: "heatmap", name: "Test Visualization A", updated_at: 2.days.ago)
      @visualization_two = create(:visualization, user_id: @joe.id, visualization_type: "phylo_tree_ng", name: "Test Visualization B", updated_at: 1.day.ago)
      create(:visualization, user_id: @joe.id, visualization_type: "phylo_tree_ng", name: "Deprecated Visualization", updated_at: 1.day.ago, data: { "treeNgId" => deprecated_phylo_tree_ng.id })
      [sample_one, sample_two].each do |sample|
        @visualization_one.samples << sample
        @visualization_two.samples << sample
      end
    end

    describe "#GET index" do
      it "loads visualizations ordered by descending updated date if no sort parameters are specified" do
        get :index, params: { domain: "my_data" }
        expect(response).to have_http_status :success

        expected_visualizations = [@visualization_two, @visualization_one]

        json_response = JSON.parse(response.body)
        expect(json_response.count).to eq(expected_visualizations.count)
        expect(json_response).to include_json([
                                                { id: @visualization_two.id },
                                                { id: @visualization_one.id },
                                              ])
      end

      context "when sorting_v0 is enabled" do
        it "loads visualizations ordered by descending updated date if no sort parameters are specified" do
          @joe.add_allowed_feature("sorting_v0")
          get :index, params: { domain: "my_data" }
          expect(response).to have_http_status :success

          expected_visualizations = [@visualization_two, @visualization_one]

          json_response = JSON.parse(response.body)
          expect(json_response.count).to eq(expected_visualizations.count)
          expect(json_response).to include_json([
                                                  { id: @visualization_two.id },
                                                  { id: @visualization_one.id },
                                                ])
        end
      end
    end
  end
  describe "#PUT Update" do
    before do
      sign_in @joe
      project = create(:project)
      sample_one = create(:sample, project: project)
      sample_two = create(:sample, project: project)
      @visualization_one = create(:visualization, user_id: @joe.id, visualization_type: "heatmap", name: "Test Visualization A", updated_at: 2.days.ago, samples: [sample_one, sample_two])
    end
    it "update visualization name" do
      put :update, params: { id: @visualization_one.id, name: "TestHeatmap" }

      expect(@visualization_one.reload.name).to eq("TestHeatmap")
      expect(response).to have_http_status(:ok)
    end
  end
end
