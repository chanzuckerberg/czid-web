require 'rails_helper'

describe Visualization, type: :model do
  context "#sort_visualizations" do
    before do
      user = create(:user)
      # Note: visualizations two and three are created out of order for testing purposes
      # Test visualizations are created where:
      #   - @visualizations_one contains a low-value sortable data
      #   - @visualization_two and @visualization_three contain the same high-value sortable data (for tiebreaker testing)
      #   - visualization_four (optional) contains null sortable data
      # such that visualization_four < @visualization_one < @visualization_three < @visualization_two.
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

    context "when sorting by sample count" do
      let(:order_by) { "samples_count" }

      before do
        project = create(:project)
        sample_one = create(:sample, project: project)
        sample_two = create(:sample, project: project)
        sample_three = create(:sample, project: project)

        # add 2 samples to @visualization_one
        # add 3 samples to @visualization_two and @visualization_three
        [sample_one, sample_two].each do |sample|
          @visualization_one.samples << sample
          @visualization_two.samples << sample
          @visualization_three.samples << sample
        end
        @visualization_two.samples << sample_three
        @visualization_three.samples << sample_three
      end

      it "returns visualizations in ascending sample count when order_dir is ascending" do
        asc_results = Visualization.sort_visualizations(@visualizations_input, order_by, "asc")
        expect(asc_results.pluck(:id)).to eq([@visualization_one.id, @visualization_three.id, @visualization_two.id])
      end

      it "returns visualizations in descending sample count when order_dir is descending" do
        desc_results = Visualization.sort_visualizations(@visualizations_input, order_by, "desc")
        expect(desc_results.pluck(:id)).to eq([@visualization_two.id, @visualization_three.id, @visualization_one.id])
      end
    end
  end
end
