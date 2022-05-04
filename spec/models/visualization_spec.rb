require 'rails_helper'

describe Visualization, type: :model do
  let(:user) { create(:user) }

  context "#project_name" do
    let(:visualization) { create(:visualization, user_id: user.id, visualization_type: "heatmap", name: "Test Visualization A", updated_at: 3.days.ago) }

    # Project name capitalization is intentionally inconsistent to test case insensitive sorting
    let(:project_one) { create(:project, name: "a project") }
    let(:project_two) { create(:project, name: "B project") }
    let(:project_three) { create(:project, name: "c Project") }

    context "when visualization only has one associated project" do
      before do
        visualization.samples << create(:sample, project: project_one)
      end

      it "returns correct project name" do
        expect(visualization.project_name).to eq("a project")
      end
    end

    context "when visualization has two distinct projects" do
      before do
        visualization.samples << create(:sample, project: project_one)
        visualization.samples << create(:sample, project: project_two)
        visualization.samples << create(:sample, project: project_two)
      end

      it "returns name with unique projects namesorted in case-insensitive order joined with 'and'" do
        expect(visualization.project_name).to eq("a project and B project")
      end
    end

    context "when visualization has three distinct projects" do
      before do
        visualization.samples << create(:sample, project: project_one)
        visualization.samples << create(:sample, project: project_one)
        visualization.samples << create(:sample, project: project_two)
        visualization.samples << create(:sample, project: project_two)
        visualization.samples << create(:sample, project: project_three)
      end

      it "returns name with unique projects sorted in case-insensitive order in a comma separated list" do
        expect(visualization.project_name).to eq("a project, B project, and c Project")
      end
    end
  end

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

      # No samples / projects for @visualization_four to test NULL sorting order
      @visualization_four = create(:visualization, user_id: user.id, visualization_type: "phylo_tree_ng", name: "Test Visualization C", updated_at: 1.day.ago)

      @visualizations_input = Visualization.where(id: [@visualization_one.id, @visualization_two.id, @visualization_three.id])
    end

    context "when invalid order by key passed" do
      let(:data_key) { "invalid_data_key" }

      it "returns unsorted projects when order_dir is 'asc'" do
        results = Visualization.sort_visualizations(@visualizations_input, data_key, "asc")
        expect(results.pluck(:id)).to eq(@visualizations_input.pluck(:id))
      end

      it "returns unsorted projects when order_dir is 'desc'" do
        results = Visualization.sort_visualizations(@visualizations_input, data_key, "desc")
        expect(results.pluck(:id)).to eq(@visualizations_input.pluck(:id))
      end
    end

    context "when sorting by visualization name" do
      let(:data_key) { "visualization" }

      it "returns visualization in ascending order by name when order_dir is 'asc'" do
        asc_results = Visualization.sort_visualizations(@visualizations_input, data_key, "asc")
        expect(asc_results.pluck(:id)).to eq([@visualization_one.id, @visualization_three.id, @visualization_two.id])
      end

      it "returns visualization in descending order by name when order_dir is 'desc'" do
        desc_results = Visualization.sort_visualizations(@visualizations_input, data_key, "desc")
        expect(desc_results.pluck(:id)).to eq([@visualization_two.id, @visualization_three.id, @visualization_one.id])
      end
    end

    context "when sorting by visualization updated date" do
      let(:data_key) { "updated_at" }

      it "returns visualization in ascending order by updated date when order_dir is 'asc'" do
        asc_results = Visualization.sort_visualizations(@visualizations_input, data_key, "asc")
        expect(asc_results.pluck(:id)).to eq([@visualization_one.id, @visualization_three.id, @visualization_two.id])
      end

      it "returns visualization in descending order by updated date when order_dir is 'desc'" do
        desc_results = Visualization.sort_visualizations(@visualizations_input, data_key, "desc")
        expect(desc_results.pluck(:id)).to eq([@visualization_two.id, @visualization_three.id, @visualization_one.id])
      end
    end

    context "when sorting by visualization project names" do
      let(:data_key) { "project_name" }
      let(:project_c) { create(:project, name: "c project") }
      let(:project_d) { create(:project, name: "d project") }

      before do
        visualization_one_p1_sample = create(:sample, project: create(:project, name: "a project"))
        visualization_one_p2_sample = create(:sample, project: create(:project, name: "g project"))
        @visualization_one.samples = [visualization_one_p1_sample, visualization_one_p2_sample]

        visualization_two_p1_sample = create(:sample, project: project_c)
        visualization_two_p2_sample = create(:sample, project: project_d)
        visualization_three_p1_sample = create(:sample, project: project_c)
        visualization_three_p2_sample = create(:sample, project: project_d)

        @visualization_two.samples = [visualization_two_p1_sample, visualization_two_p2_sample]
        @visualization_three.samples = [visualization_three_p1_sample, visualization_three_p2_sample]

        @visualizations_input = Visualization.where(id: [@visualization_one.id, @visualization_two.id, @visualization_three.id, @visualization_four.id])
      end

      it "returns visualization in ascending order by project names when order_dir is 'asc'" do
        asc_results = Visualization.sort_visualizations(@visualizations_input, data_key, "asc")
        expect(asc_results.pluck(:id)).to eq([@visualization_four.id, @visualization_one.id, @visualization_three.id, @visualization_two.id])
      end

      it "returns visualization in descending order by project name when order_dir is 'desc'" do
        desc_results = Visualization.sort_visualizations(@visualizations_input, data_key, "desc")
        expect(desc_results.pluck(:id)).to eq([@visualization_two.id, @visualization_three.id, @visualization_one.id, @visualization_four.id])
      end
    end

    context "when sorting by sample count" do
      let(:data_key) { "samples_count" }

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

        @visualizations_input = Visualization.where(id: [@visualization_one.id, @visualization_two.id, @visualization_three.id])
      end

      it "returns visualizations in ascending sample count when order_dir is ascending" do
        asc_results = Visualization.sort_visualizations(@visualizations_input, data_key, "asc")
        expect(asc_results.pluck(:id)).to eq([@visualization_one.id, @visualization_three.id, @visualization_two.id])
      end

      it "returns visualizations in descending sample count when order_dir is descending" do
        desc_results = Visualization.sort_visualizations(@visualizations_input, data_key, "desc")
        expect(desc_results.pluck(:id)).to eq([@visualization_two.id, @visualization_three.id, @visualization_one.id])
      end
    end
  end
end
