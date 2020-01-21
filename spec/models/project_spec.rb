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
end
