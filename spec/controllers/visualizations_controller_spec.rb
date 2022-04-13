require 'rails_helper'

RSpec.describe VisualizationsController, type: :controller do
  create_users

  context "Non-admin" do
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
      @expected_visualizations = [@visualization_one, @visualization_two]
    end

    describe "#GET index" do
      it "loads a list of visualizations" do
        get :index, params: { domain: "my_data" }
        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response.count).to eq(@expected_visualizations.count)
        expect(json_response.pluck("id")).to contain_exactly(*@expected_visualizations.pluck("id"))
      end

      it "loads a list of visualizations (with sorting_v0 enabled)" do
        @joe.add_allowed_feature("sorting_v0")
        get :index, params: { domain: "my_data" }
        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response.count).to eq(@expected_visualizations.count)
        expect(json_response.pluck("id")).to contain_exactly(*@expected_visualizations.pluck("id"))
      end
    end
  end
end
