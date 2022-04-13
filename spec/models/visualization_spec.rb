require 'rails_helper'

describe Visualization, type: :model do
  context "#sort_visualizations" do
    before do
      user = create(:user)
      # Note: visualizations two and three are created out of order for testing purposes
      @visualization_one = create(:visualization, user_id: user.id, visualization_type: "heatmap", name: "Test Visualization A", updated_at: 3.days.ago)
      @visualization_three = create(:visualization, user_id: user.id, visualization_type: "phylo_tree_ng", name: "Test Visualization B", updated_at: 2.days.ago)
      @visualization_two = create(:visualization, user_id: user.id, visualization_type: "phylo_tree_ng", name: "Test Visualization B", updated_at: 1.day.ago)

      @visualizations_input = Visualization.where(id: [@visualization_one.id, @visualization_two.id, @visualization_three.id])
    end

    it "returns unsorted visualizations for invalid/unsortable data keys" do
      results = Visualization.sort_visualizations(@visualizations_input, "invalid_data_key", "asc")
      expect(results.pluck(:id)).to eq(@visualizations_input.pluck(:id))

      results = Visualization.sort_visualizations(@visualizations_input, "invalid_data_key", "desc")
      expect(results.pluck(:id)).to eq(@visualizations_input.pluck(:id))
    end

    it "correctly sorts visualizations by name" do
      asc_results = Visualization.sort_visualizations(@visualizations_input, "visualization", "asc")
      expect(asc_results.pluck(:id)).to eq([@visualization_one.id, @visualization_three.id, @visualization_two.id])

      desc_results = Visualization.sort_visualizations(@visualizations_input, "visualization", "desc")
      expect(desc_results.pluck(:id)).to eq([@visualization_two.id, @visualization_three.id, @visualization_one.id])
    end

    it "correctly sorts visualizations by updated_at" do
      asc_results = Visualization.sort_visualizations(@visualizations_input, "updated_at", "asc")
      expect(asc_results.pluck(:id)).to eq([@visualization_one.id, @visualization_three.id, @visualization_two.id])

      desc_results = Visualization.sort_visualizations(@visualizations_input, "updated_at", "desc")
      expect(desc_results.pluck(:id)).to eq([@visualization_two.id, @visualization_three.id, @visualization_one.id])
    end
  end
end
