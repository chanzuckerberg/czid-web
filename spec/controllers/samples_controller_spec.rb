require 'rails_helper'

RSpec.describe SamplesController, type: :controller do
  create_users

  # Non-admin, aka Joe, specific behavior
  context "Joe" do
    before do
      sign_in @joe
    end

    describe "GET raw_results_folder (nonadmin)" do
      it "can see raw results on the user's own samples" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project, user: @joe)
        get :raw_results_folder, params: { id: sample.id }
        expect(response).to have_http_status :success
      end

      it "cannot see raw results on another user's sample" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project)
        get :raw_results_folder, params: { id: sample.id }
        expect(response).to have_http_status :unauthorized
      end
    end

    describe "GET results_folder (nonadmin)" do
      it "can see results on the user's own samples" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project, user: @joe)
        get :results_folder, params: { id: sample.id }
        expect(response).to have_http_status :success
      end

      it "can see results on the user's own samples with previous pipeline version" do
        project = create(:project, users: [@joe])
        sample_one = create(:sample, project: project, name: "Test Sample One", user: @joe,
                                     pipeline_runs_data: [
                                       { finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.10" },
                                       { finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" },
                                     ])
        expect_any_instance_of(Sample).to receive(:results_folder_files).with("3.10").exactly(1).times.and_return({})

        get :results_folder, params: { id: sample_one.id, pipeline_version: "3.10" }

        expect(response).to have_http_status :success
      end

      it "can see results on another user's sample (if part of that project)" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project)
        get :results_folder, params: { id: sample.id }
        expect(response).to have_http_status :success
      end
    end

    describe "POST #taxa_with_reads_suggestions" do
      before do
        @project = create(:project, users: [@joe])
        @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
        @sample_two = create(:sample, project: @project, name: "Test Sample Two",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
        @sample_three = create(:sample, project: @project, name: "Test Sample Three",
                                        pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
        create(:taxon_count, tax_id: 100, pipeline_run_id: @sample_one.first_pipeline_run.id)
        create(:taxon_count, tax_id: 100, pipeline_run_id: @sample_two.first_pipeline_run.id)
        create(:taxon_count, tax_id: 100, pipeline_run_id: @sample_three.first_pipeline_run.id)
        create(:taxon_count, tax_id: 200, pipeline_run_id: @sample_one.first_pipeline_run.id)
        create(:taxon_count, tax_id: 200, pipeline_run_id: @sample_two.first_pipeline_run.id)
        create(:taxon_count, tax_id: 300, pipeline_run_id: @sample_one.first_pipeline_run.id)
      end

      let(:taxon_search_results) do
        [
          {
            "taxid" => 100,
            "name" => "Mock Taxa 100",
          },
          {
            "taxid" => 200,
            "name" => "Mock Taxa 200",
          },
          {
            "taxid" => 300,
            "name" => "Mock Taxa 300",
          },
        ]
      end

      it "should return taxon list with correct sample counts" do
        mock_query = "MOCK_QUERY"

        expect(controller).to receive(:taxon_search).with(mock_query, ["species", "genus"], any_args).exactly(1).times
                                                    .and_return(taxon_search_results)

        post :taxa_with_reads_suggestions, params: { format: "json", sampleIds: [@sample_one.id, @sample_two.id, @sample_three.id], query: mock_query }

        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(3)
        expect(json_response).to include_json([
                                                {
                                                  "taxid" => 100,
                                                  "name" => "Mock Taxa 100",
                                                  "sample_count" => 3,
                                                },
                                                {
                                                  "taxid" => 200,
                                                  "name" => "Mock Taxa 200",
                                                  "sample_count" => 2,
                                                },
                                                {
                                                  "taxid" => 300,
                                                  "name" => "Mock Taxa 300",
                                                  "sample_count" => 1,
                                                },
                                              ])
      end

      it "should return unauthorized if user doesn't have access to sample" do
        project_admin = create(:project, users: [@admin])
        sample_admin = create(:sample, project: project_admin, name: "Test Sample Admin",
                                       pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])

        post :taxa_with_reads_suggestions, params: { format: "json", sampleIds: [@sample_one.id, sample_admin.id], query: "MOCK_QUERY" }

        expect(response).to have_http_status :unauthorized
      end

      it "doesn't count samples that weren't passed in" do
        mock_query = "MOCK_QUERY"

        expect(controller).to receive(:taxon_search).with(mock_query, ["species", "genus"], any_args).exactly(1).times
                                                    .and_return(taxon_search_results)

        post :taxa_with_reads_suggestions, params: { format: "json", sampleIds: [@sample_one.id, @sample_two.id], query: mock_query }

        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(3)
        expect(json_response).to include_json([
                                                {
                                                  "taxid" => 100,
                                                  "name" => "Mock Taxa 100",
                                                  "sample_count" => 2,
                                                },
                                                {
                                                  "taxid" => 200,
                                                  "name" => "Mock Taxa 200",
                                                  "sample_count" => 2,
                                                },
                                                {
                                                  "taxid" => 300,
                                                  "name" => "Mock Taxa 300",
                                                  "sample_count" => 1,
                                                },
                                              ])
      end

      it "should omit taxons with no samples that were returned from search" do
        mock_query = "MOCK_QUERY"

        modified_search_results = taxon_search_results + [
          {
            "taxid" => 400,
            "name" => "Mock Taxa 400",
          },
        ]

        expect(controller).to receive(:taxon_search).with(mock_query, ["species", "genus"], any_args).exactly(1).times
                                                    .and_return(modified_search_results)

        post :taxa_with_reads_suggestions, params: { format: "json", sampleIds: [@sample_one.id, @sample_two.id, @sample_three.id], query: mock_query }

        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(3)
        expect(json_response).to include_json([
                                                {
                                                  "taxid" => 100,
                                                  "name" => "Mock Taxa 100",
                                                  "sample_count" => 3,
                                                },
                                                {
                                                  "taxid" => 200,
                                                  "name" => "Mock Taxa 200",
                                                  "sample_count" => 2,
                                                },
                                                {
                                                  "taxid" => 300,
                                                  "name" => "Mock Taxa 300",
                                                  "sample_count" => 1,
                                                },
                                              ])
      end
    end

    describe "POST #taxa_with_contigs_suggestions" do
      before do
        @project = create(:project, users: [@joe])
        @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
        @sample_two = create(:sample, project: @project, name: "Test Sample Two",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
        @sample_three = create(:sample, project: @project, name: "Test Sample Three",
                                        pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])

        # A taxid can either by genus or species level, but not both.
        create(:contig, pipeline_run_id: @sample_one.first_pipeline_run.id, species_taxid_nt: 1, species_taxid_nr: 2, genus_taxid_nt: 101, genus_taxid_nr: 101)
        create(:contig, pipeline_run_id: @sample_two.first_pipeline_run.id, species_taxid_nt: 1, species_taxid_nr: 1, genus_taxid_nt: 102, genus_taxid_nr: 103)
        create(:contig, pipeline_run_id: @sample_three.first_pipeline_run.id, species_taxid_nt: 2, species_taxid_nr: 1, genus_taxid_nt: 101, genus_taxid_nr: 101)
        create(:contig, pipeline_run_id: @sample_three.first_pipeline_run.id, species_taxid_nt: 2, species_taxid_nr: 3, genus_taxid_nt: 102, genus_taxid_nr: 104)
      end

      let(:taxon_search_results) do
        [
          {
            "title" => "Taxon 1",
            "description" => "Description for Taxon 1",
            "taxid" => 1,
            "level" => "species",
          },
          {
            "title" => "Taxon 2",
            "description" => "Description for Taxon 2",
            "taxid" => 2,
            "level" => "species",
          },
          {
            "title" => "Taxon 3",
            "description" => "Description for Taxon 3",
            "taxid" => 101,
            "level" => "genus",
          },
          {
            "title" => "Taxon 4",
            "description" => "Description for Taxon 4",
            "taxid" => 102,
            "level" => "genus",
          },
        ]
      end

      it "should return taxon list with correct sample counts" do
        mock_query = "MOCK_QUERY"

        expect(controller).to receive(:taxon_search).with(mock_query, ["species", "genus"], any_args).exactly(1).times
                                                    .and_return(taxon_search_results)

        post :taxa_with_contigs_suggestions, params: { format: "json", sampleIds: [@sample_one.id, @sample_two.id, @sample_three.id], query: mock_query }

        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(4)
        expect(json_response).to include_json([
                                                {
                                                  "taxid" => 1,
                                                  "sample_count" => 3,
                                                },
                                                {
                                                  "taxid" => 2,
                                                  "sample_count" => 2,
                                                },
                                                {
                                                  "taxid" => 101,
                                                  "sample_count" => 2,
                                                },
                                                {
                                                  "taxid" => 102,
                                                  "sample_count" => 2,
                                                },
                                              ])
      end

      it "should return unauthorized if user doesn't have access to sample" do
        project_admin = create(:project, users: [@admin])
        sample_admin = create(:sample, project: project_admin, name: "Test Sample Admin",
                                       pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])

        post :taxa_with_contigs_suggestions, params: { format: "json", sampleIds: [@sample_one.id, sample_admin.id], query: "MOCK_QUERY" }

        expect(response).to have_http_status :unauthorized
      end

      it "doesn't count samples that weren't passed in" do
        mock_query = "MOCK_QUERY"

        expect(controller).to receive(:taxon_search).with(mock_query, ["species", "genus"], any_args).exactly(1).times
                                                    .and_return(taxon_search_results)

        post :taxa_with_contigs_suggestions, params: { format: "json", sampleIds: [@sample_one.id, @sample_two.id], query: mock_query }

        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(4)
        expect(json_response).to include_json([
                                                {
                                                  "taxid" => 1,
                                                  "sample_count" => 2,
                                                },
                                                {
                                                  "taxid" => 2,
                                                  "sample_count" => 1,
                                                },
                                                {
                                                  "taxid" => 101,
                                                  "sample_count" => 1,
                                                },
                                                {
                                                  "taxid" => 102,
                                                  "sample_count" => 1,
                                                },
                                              ])
      end

      it "omits taxa returned from search with no sample count" do
        mock_query = "MOCK_QUERY"

        modified_search_results = taxon_search_results + [
          {
            "title" => "Taxon 5",
            "description" => "Description for Taxon 5",
            "taxid" => 1000,
            "level" => "genus",
          },
        ]

        expect(controller).to receive(:taxon_search).with(mock_query, ["species", "genus"], any_args).exactly(1).times
                                                    .and_return(modified_search_results)

        post :taxa_with_contigs_suggestions, params: { format: "json", sampleIds: [@sample_one.id, @sample_two.id], query: mock_query }

        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(4)
        expect(json_response).to include_json([
                                                {
                                                  "taxid" => 1,
                                                  "sample_count" => 2,
                                                },
                                                {
                                                  "taxid" => 2,
                                                  "sample_count" => 1,
                                                },
                                                {
                                                  "taxid" => 101,
                                                  "sample_count" => 1,
                                                },
                                                {
                                                  "taxid" => 102,
                                                  "sample_count" => 1,
                                                },
                                              ])
      end
    end

    describe "#index" do
      it "returns basic samples with correctly formatted date" do
        project = create(:project, users: [@joe])
        create(:sample, name: "Mosquito Sample", project: project, user: @joe, host_genome_name: "Mosquito", metadata_fields: { collection_date: "2019-01-01" })

        get :index, params: { project_id: project.id, basic: true }
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(1)
        expect(json_response).to include_json([
                                                {
                                                  "name" => "Mosquito Sample",
                                                  "metadata" => {
                                                    "collection_date" => "2019-01-01",
                                                  },
                                                },

                                              ])
      end

      it "for human samples, truncates date metadata to month" do
        project = create(:project, users: [@joe])
        create(:sample, name: "Human Sample", project: project, user: @joe, host_genome_name: "Human", metadata_fields: { collection_date: "2019-01" })

        get :index, params: { project_id: project.id, basic: true }
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(1)
        expect(json_response).to include_json([
                                                {
                                                  "name" => "Human Sample",
                                                  "metadata" => {
                                                    "collection_date" => "2019-01",
                                                  },
                                                },
                                              ])
      end
    end
  end

  describe "POST #uploaded_by_current_user" do
    before do
      @project = create(:project, users: [@joe, @admin])
      @sample_one = create(:sample, project: @project, name: "Test Sample One", user: @joe)
      @sample_two = create(:sample, project: @project, name: "Test Sample Two", user: @joe)
      @sample_three = create(:sample, project: @project, name: "Test Sample Three", user: @admin)
      sign_in @joe
    end

    it "should return true if all samples were uploaded by user" do
      post :uploaded_by_current_user, params: { sampleIds: [@sample_one.id, @sample_two.id] }
      json_response = JSON.parse(response.body)
      expect(json_response).to include_json(uploaded_by_current_user: true)
    end

    it "should return false if some samples were not uploaded by user, even if user belongs to the sample's project" do
      post :uploaded_by_current_user, params: { sampleIds: [@sample_one.id, @sample_two.id, @sample_three.id] }
      json_response = JSON.parse(response.body)
      expect(json_response).to include_json(uploaded_by_current_user: false)
    end
  end

  context "User without report_v2 flag" do
    before do
      sign_in @joe
      @project = create(:project, users: [@joe])
    end

    describe "GET show_v2" do
      it "redirected to home page" do
        sample = create(:sample, project: @project)
        get :show_v2, params: { id: sample.id }
        expect(response).to redirect_to(root_path)
      end
    end
  end

  context "User with report_v2 flag" do
    before do
      sign_in @joe
      @joe.add_allowed_feature("report_v2")
      @project = create(:project, users: [@joe])
    end

    describe "GET show_v2" do
      it "can see sample report_v2" do
        sample = create(:sample, project: @project)
        get :show_v2, params: { id: sample.id }
        expect(response).to have_http_status :success
      end
    end
  end

  context "Admin without report_v2 flag" do
    before do
      sign_in @admin
      @project = create(:project, users: [@admin])
    end

    describe "GET show_v2" do
      it "redirected to home page" do
        sample = create(:sample, project: @project)
        get :show_v2, params: { id: sample.id }
        expect(response).to redirect_to(root_path)
      end
    end
  end
end
