require 'rails_helper'

describe Project, type: :model do
  context "#search_by_name" do
    before do
      @project_single_match1 = create(:project, name: "Project test single match 1")
      @project_single_match2 = create(:project, name: "Project test single match 2")
      @project_partial_match = create(:project, name: "Project test anywhereSinglePartial match")
      @project_multiple_match = create(:project, name: "Project test single and multiple match")
      @project_no_match = create(:project, name: "Project test with no match")
    end

    subject { Project.search_by_name(query) }

    context "with a single word query" do
      let(:query) { "single" }

      it "returns samples matching single word query" do
        expect(subject.pluck(:name)).to include(@project_single_match1.name, @project_single_match2.name, @project_multiple_match.name)
      end

      it "returns samples with partial matches" do
        expect(subject.pluck(:name)).to include(@project_partial_match.name)
      end

      it "does not return samples with no matches" do
        expect(subject.pluck(:name)).to_not include(@project_no_match.name)
      end
    end

    context "with a multiple word query" do
      let(:query) { "single multiple" }

      it "returns only samples matching all tokens in query" do
        expect(subject.pluck(:name)).to eq([@project_multiple_match.name])
      end
    end
  end

  context "#sort_projects" do
    before do
      # Note: projects two and three are created out of order for testing purposes
      @project_one = create(:project, name: "Test Project A", created_at: 3.days.ago)
      @project_three = create(:project, name: "Test Project B", created_at: 2.days.ago)
      @project_two = create(:project, name: "Test Project C", created_at: 1.day.ago)

      @projects_input = Project.where(id: [@project_one.id, @project_two.id, @project_three.id])
    end

    it "returns unsorted projects for invalid/unsortable data keys" do
      asc_results = Project.sort_projects(@projects_input, "invalid_data_key", "asc")
      expect(asc_results.pluck(:id)).to eq(@projects_input.pluck(:id))

      desc_results = Project.sort_projects(@projects_input, "invalid_data_key", "desc")
      expect(desc_results.pluck(:id)).to eq(@projects_input.pluck(:id))
    end

    it "correctly sorts projects by name" do
      asc_results = Project.sort_projects(@projects_input, "project", "asc")
      expect(asc_results.pluck(:id)).to eq([@project_one.id, @project_three.id, @project_two.id])

      desc_results = Project.sort_projects(@projects_input, "project", "desc")
      expect(desc_results.pluck(:id)).to eq([@project_two.id, @project_three.id, @project_one.id])
    end

    it "correctly sorts projects by created_at" do
      asc_results = Project.sort_projects(@projects_input, "created_at", "asc")
      expect(asc_results.pluck(:id)).to eq([@project_one.id, @project_three.id, @project_two.id])

      desc_results = Project.sort_projects(@projects_input, "created_at", "desc")
      expect(desc_results.pluck(:id)).to eq([@project_two.id, @project_three.id, @project_one.id])
    end
  end
end
