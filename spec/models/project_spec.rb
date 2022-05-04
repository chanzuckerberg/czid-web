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
      # Test projects are created where:
      #   - @project_one contains a low-value sortable data
      #   - @project_two and @project_three contain the same high-value sortable data (for tiebreaker testing)
      #   - project_four (optional) contains null sortable data
      # such that project_four < @project_one < @project_three < @project_two.
      @project_one = create(:project, name: "Test Project A", created_at: 3.days.ago)
      @project_three = create(:project, name: "Test Project B", created_at: 2.days.ago)
      @project_two = create(:project, name: "Test Project C", created_at: 1.day.ago)
      @project_four = create(:project, name: "Test Project D", created_at: 1.hour.ago)

      @projects_input = Project.where(id: [@project_one.id, @project_two.id, @project_three.id])
    end

    context "when invalid order by key passed" do
      let(:order_by) { "invalid_data_key" }

      it "returns unsorted projects when order_dir is 'asc'" do
        asc_results = Project.sort_projects(@projects_input, order_by, "asc")
        expect(asc_results.pluck(:id)).to eq(@projects_input.pluck(:id))
      end

      it "returns unsorted projects when order_dir is 'desc'" do
        desc_results = Project.sort_projects(@projects_input, order_by, "desc")
        expect(desc_results.pluck(:id)).to eq(@projects_input.pluck(:id))
      end
    end

    context "when sorting by project name" do
      let(:order_by) { "project" }

      it "returns projects in ascending order by name when order_dir is 'asc'" do
        asc_results = Project.sort_projects(@projects_input, order_by, "asc")
        expect(asc_results.pluck(:id)).to eq([@project_one.id, @project_three.id, @project_two.id])
      end

      it "returns projects in descending order by name when order_dir is 'desc'" do
        desc_results = Project.sort_projects(@projects_input, order_by, "desc")
        expect(desc_results.pluck(:id)).to eq([@project_two.id, @project_three.id, @project_one.id])
      end
    end

    context "when sorting by project creation date" do
      let(:order_by) { "created_at" }

      it "returns projects in ascending creation order when order_dir is 'asc'" do
        asc_results = Project.sort_projects(@projects_input, order_by, "asc")
        expect(asc_results.pluck(:id)).to eq([@project_one.id, @project_three.id, @project_two.id])
      end

      it "returns projects in descending creation order when order_dir is 'desc'" do
        desc_results = Project.sort_projects(@projects_input, order_by, "desc")
        expect(desc_results.pluck(:id)).to eq([@project_two.id, @project_three.id, @project_one.id])
      end
    end

    context "when sorting by hosts" do
      let(:order_by) { "hosts" }

      before do
        create(:sample, project: @project_one, host_genome_name: "Cow")

        create(:sample, project: @project_three, host_genome_name: "Human")
        create(:sample, project: @project_three, host_genome_name: "Koala")

        create(:sample, project: @project_two, host_genome_name: "Human")
        create(:sample, project: @project_two, host_genome_name: "Koala")

        @projects_input = Project.where(id: [@project_one.id, @project_two.id, @project_three.id, @project_four.id])
      end

      it "sorts projects in ascending order of hosts when order_dir is 'asc'" do
        asc_results = Project.sort_projects(@projects_input, order_by, "asc")
        expect(asc_results.map(&:id)).to eq([@project_four.id, @project_one.id, @project_three.id, @project_two.id])
      end

      it "sorts projects in descending order of  hosts when order_dir is 'desc'" do
        desc_results = Project.sort_projects(@projects_input, order_by, "desc")
        expect(desc_results.map(&:id)).to eq([@project_two.id, @project_three.id, @project_one.id, @project_four.id])
      end
    end

    context "when sorting by sample type" do
      let(:order_by) { "tissues" }

      before do
        create(:sample, project: @project_one, metadata_fields: { sample_type: "CSF" })

        create(:sample, project: @project_three, metadata_fields: { sample_type:  "Serum" })
        create(:sample, project: @project_three, metadata_fields: { sample_type:  "Nasopharyngeal Swab" })

        create(:sample, project: @project_two, metadata_fields: { sample_type: "Serum" })
        create(:sample, project: @project_two, metadata_fields: { sample_type: "Nasopharyngeal Swab" })

        @projects_input = Project.where(id: [@project_one.id, @project_two.id, @project_three.id, @project_four.id])
      end

      it "sorts projects in ascending order of hosts when order_dir is 'asc'" do
        asc_results = Project.sort_projects(@projects_input, order_by, "asc")
        expect(asc_results.map(&:id)).to eq([@project_four.id, @project_one.id, @project_three.id, @project_two.id])
      end

      it "sorts projects in descending order of  hosts when order_dir is 'desc'" do
        desc_results = Project.sort_projects(@projects_input, order_by, "desc")
        expect(desc_results.map(&:id)).to eq([@project_two.id, @project_three.id, @project_one.id, @project_four.id])
      end
    end

    context "when sorting by sample count" do
      let(:order_by) { "sample_counts" }

      before do
        # @project_one contains 0 samples, @project_two and @project_three each contain 1 sample
        create(:sample, project: @project_two, initial_workflow: "short-read-mngs")
        create(:sample, project: @project_three, initial_workflow: "consensus-genome")
      end

      it "returns projects in ascending sample count when order_dir is ascending" do
        asc_results = Project.sort_projects(@projects_input, order_by, "asc")
        expect(asc_results.pluck(:id)).to eq([@project_one.id, @project_three.id, @project_two.id])
      end

      it "rreturns projects in descending sample count when order_dir is descending" do
        desc_results = Project.sort_projects(@projects_input, order_by, "desc")
        expect(desc_results.pluck(:id)).to eq([@project_two.id, @project_three.id, @project_one.id])
      end
    end
  end
end
