require 'rails_helper'
require 'support/samples_controller_constants'

RSpec.describe SamplesController, type: :controller do
  create_users

  before do
    stub_const('SAMPLES_BUCKET_NAME', "fake_bucket_name")
  end
  # Non-admin, aka Joe, specific behavior
  context "Joe" do
    before do
      sign_in @joe
    end

    describe "GET index_v2" do
      it "loads list of samples with correct visibility" do
        project = create(:project, users: [@joe], days_to_keep_sample_private: 365)
        sample_private = create(:sample, project: project, user: @joe, created_at: 6.months.ago)
        sample_public = create(:sample, project: project, user: @joe, created_at: 2.years.ago)
        get :index_v2, format: :json, params: { project_id: project.id, domain: "my_data" }
        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response["samples"].length).to eq(2)
        expect(json_response).to include_json(samples: [
                                                { id: sample_public.id, public: 1 },
                                                { id: sample_private.id, public: 0 },
                                              ])
      end

      it "loads a correctly sorted list of samples (without sorting_v0 enabled)" do
        project = create(:project, users: [@joe])
        sample_one = create(:sample, project: project, user: @joe, name: "Test Sample B")
        sample_two = create(:sample, project: project, user: @joe, name: "Test Sample A")
        get :index_v2, format: :json, params: { project_id: project.id, domain: "my_data", orderBy: "name", orderDir: "asc" }
        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response["samples"].length).to eq(2)
        expect(json_response).to include_json(
          samples: [
            { id: sample_one.id },
            { id: sample_two.id },
          ]
        )
      end

      context "when sorting_v0 is enabled" do
        it "loads samples ordered by descending creation date if no sort parameters are specified" do
          @joe.add_allowed_feature("sorting_v0")

          project = create(:project, users: [@joe])
          sample_one = create(:sample, project: project, user: @joe, name: "Test Sample B")
          sample_two = create(:sample, project: project, user: @joe, name: "Test Sample A")

          get :index_v2, format: :json, params: { project_id: project.id, domain: "my_data" }
          expect(response).to have_http_status :success

          json_response = JSON.parse(response.body)
          expect(json_response["samples"].length).to eq(2)
          expect(json_response).to include_json(samples: [
                                                  { id: sample_two.id },
                                                  { id: sample_one.id },
                                                ])
        end
      end
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
                                       { finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.10", pipeline_execution_strategy: PipelineRun.pipeline_execution_strategies[:directed_acyclic_graph] },
                                       { finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12", pipeline_execution_strategy: PipelineRun.pipeline_execution_strategies[:directed_acyclic_graph] },
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

      it "cannot see host filtering urls on another user's sample" do
        allow_any_instance_of(PipelineRun).to receive(:sfn_outputs_by_step).with(true).and_return(SamplesControllerConstants::SFN_RESULTS_FOLDER_UPLOADER_RESPONSE)
        allow_any_instance_of(PipelineRun).to receive(:sfn_outputs_by_step).with(false).and_return(SamplesControllerConstants::SFN_RESULTS_FOLDER_NONOWNER_RESPONSE)

        project = create(:project, users: [@joe])
        sample = create(:sample, project: project, pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
        get :results_folder, params: { id: sample.id, format: 'json' }
        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        host_filter_data = json_response["displayedData"]["hostFiltering"]
        host_filter_data["steps"].each do |_step, step_data|
          urls = step_data["fileList"].pluck(:url)
          urls.each { |url| expect(url).to be(nil) }
        end
      end
    end

    describe "GET #reads_stats.json" do
      before do
        @project = create(:project, users: [@joe])
        @sample_one = create(:sample, project: @project, name: "Test Sample One",
                                      pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, pipeline_version: "3.12" }])
      end

      it "can see reads_stats results" do
        allow(ReadsStatsService).to receive(:call).with(a_collection_containing_exactly(@sample_one)).and_return(SamplesControllerConstants::READS_STATS_SERVICE_VALID_RESPONSE)

        get :reads_stats, params: { sampleIds: [@sample_one.id] }
        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        sample_read_stats = json_response[json_response.keys[0]]
        expect(sample_read_stats.keys).to include(:steps.to_s, :initialReads.to_s, :sampleId.to_s)
        expect(sample_read_stats[:steps.to_s].count).to eq(9)
      end

      it "cannot see samples outside of viewable scope" do
        admin_project = create(:project, users: [@admin])
        admin_sample = create(:sample, project: admin_project, name: "Admin Sample", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])

        allow(ReadsStatsService).to receive(:call).with(a_collection_containing_exactly(@sample_one)).and_return(SamplesControllerConstants::READS_STATS_SERVICE_VALID_RESPONSE)
        allow(ReadsStatsService).to receive(:call).with(a_collection_including(admin_sample)).and_return({})

        get :reads_stats, params: { sampleIds: [@sample_one.id, admin_sample.id] }
        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        expect(json_response.keys.count).to eq(1)
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

    describe "#index_v2" do
      it "returns basic samples with correctly formatted date" do
        project = create(:project, users: [@joe])
        create(:sample, name: "Mosquito Sample", project: project, user: @joe, host_genome_name: "Mosquito", metadata_fields: { collection_date: "2019-01-01" })

        get :index_v2, params: { projectId: project.id }, format: :json
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(1)
        expect(json_response).to include_json({
                                                "samples" => [
                                                  {
                                                    "name" => "Mosquito Sample",
                                                    "details" => {
                                                      "metadata" => {
                                                        "collection_date" => "2019-01-01",
                                                      },
                                                    },
                                                  },
                                                ],
                                              })
      end

      it "for human samples, truncates date metadata to month" do
        project = create(:project, users: [@joe])
        create(:sample, name: "Human Sample", project: project, user: @joe, host_genome_name: "Human", metadata_fields: { collection_date: "2019-01" })

        get :index_v2, params: { projectId: project.id }, format: :json
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(1)
        expect(json_response).to include_json({
                                                "samples": [
                                                  {
                                                    "name" => "Human Sample",
                                                    "details" => {
                                                      "metadata" => {
                                                        "collection_date" => "2019-01",
                                                      },
                                                    },
                                                  },
                                                ],
                                              })
      end
    end

    describe "on POST #validate_sample_ids" do
      before do
        @project = create(:project, users: [@joe], name: "Test Project")
        @admin_project = create(:project, users: [@admin])
      end

      let(:good_sample_one) do
        create(:sample, project: @project, name: "Test Sample One", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, technology: PipelineRun::TECHNOLOGY_INPUT[:illumina] }])
      end

      let(:good_sample_two) do
        create(:sample, project: @project, name: "Test Sample Two", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, technology: PipelineRun::TECHNOLOGY_INPUT[:illumina] }])
      end

      let(:ont_sample) do
        create(:sample, project: @project, name: "ONT Test Sample One", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, technology: PipelineRun::TECHNOLOGY_INPUT[:nanopore] }])
      end

      let(:in_progress_sample) do
        create(:sample, project: @project, name: "In Progress Sample", pipeline_runs_data: [{ finalized: 0, job_status: PipelineRun::STATUS_RUNNING, technology: PipelineRun::TECHNOLOGY_INPUT[:illumina] }])
      end

      let(:in_progress_ont_sample) do
        create(:sample, project: @project, name: "In Progress ONT Sample", pipeline_runs_data: [{ finalized: 0, job_status: PipelineRun::STATUS_RUNNING, technology: PipelineRun::TECHNOLOGY_INPUT[:nanopore] }])
      end

      let(:failed_sample) do
        create(:sample, project: @project, name: "Failed Sample", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_FAILED, technology: PipelineRun::TECHNOLOGY_INPUT[:illumina] }])
      end

      let(:different_owner_sample) do
        create(:sample, project: @admin_project, name: "Admin Sample", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED, technology: PipelineRun::TECHNOLOGY_INPUT[:illumina] }])
      end

      let(:good_workflow_sample) do
        create(:sample, project: @project, name: "Workflow Sample One", workflow_runs_data: [{ status: WorkflowRun::STATUS[:succeeded] }])
      end

      let(:in_progress_workflow_sample) do
        create(:sample, project: @project, name: "In Progress Workflow Sample", workflow_runs_data: [{ status: WorkflowRun::STATUS[:running] }])
      end

      let(:failed_workflow_sample) do
        create(:sample, project: @project, name: "In Progress Workflow Sample", workflow_runs_data: [{ status: WorkflowRun::STATUS[:failed] }])
      end

      it "should validate successful samples owned by user" do
        validate_params = {
          sampleIds: [good_sample_one, good_sample_two],
        }

        post :validate_sample_ids, params: validate_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)

        expect(json_response).not_to eq(nil)
        expect(json_response["validIds"]).to include(good_sample_one.id)
        expect(json_response["validIds"]).to include(good_sample_two.id)
        expect(json_response["invalidSampleNames"]).to be_empty
        expect(json_response["error"]).to be_nil
      end

      it "should also validate successful samples that use workflow runs and are owned by user" do
        validate_params = {
          sampleIds: [good_workflow_sample],
          workflow: WorkflowRun::WORKFLOW[:consensus_genome],
        }

        post :validate_sample_ids, params: validate_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)

        expect(json_response).not_to eq(nil)
        expect(json_response["validIds"]).to include(good_workflow_sample.id)
        expect(json_response["invalidSampleNames"]).to be_empty
        expect(json_response["error"]).to be_nil
      end

      it "should filter out samples in progress" do
        validate_params = {
          sampleIds: [good_sample_one, good_sample_two, in_progress_sample],
        }

        post :validate_sample_ids, params: validate_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)

        expect(json_response).not_to eq(nil)
        expect(json_response["validIds"]).to include(good_sample_one.id)
        expect(json_response["validIds"]).to include(good_sample_two.id)
        expect(json_response["invalidSampleNames"]).to include(in_progress_sample.name)
        expect(json_response["error"]).to be_nil
      end

      it "should also filter out workflow-based samples in progress" do
        validate_params = {
          sampleIds: [good_workflow_sample, in_progress_workflow_sample],
          workflow: WorkflowRun::WORKFLOW[:consensus_genome],
        }

        post :validate_sample_ids, params: validate_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)

        expect(json_response).not_to eq(nil)
        expect(json_response["validIds"]).to include(good_workflow_sample.id)
        expect(json_response["invalidSampleNames"]).to include(in_progress_workflow_sample.name)
        expect(json_response["error"]).to be_nil
      end

      it "should filter out failed samples" do
        validate_params = {
          sampleIds: [good_sample_one, good_sample_two, failed_sample],
        }

        post :validate_sample_ids, params: validate_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)

        expect(json_response).not_to eq(nil)
        expect(json_response["validIds"]).to include(good_sample_one.id)
        expect(json_response["validIds"]).to include(good_sample_two.id)
        expect(json_response["invalidSampleNames"]).to include(failed_sample.name)
        expect(json_response["error"]).to be_nil
      end

      it "should filter out failed workflow-based samples" do
        validate_params = {
          sampleIds: [good_workflow_sample, failed_workflow_sample],
          workflow: WorkflowRun::WORKFLOW[:consensus_genome],
        }

        post :validate_sample_ids, params: validate_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)

        expect(json_response).not_to eq(nil)
        expect(json_response["validIds"]).to include(good_workflow_sample.id)
        expect(json_response["invalidSampleNames"]).to include(failed_workflow_sample.name)
        expect(json_response["error"]).to be_nil
      end

      it "should fetch valid samples and filter in progress samples when the workflow is long read mNGS" do
        validate_params = {
          sampleIds: [ont_sample, good_sample_one, in_progress_sample, in_progress_ont_sample],
          workflow: WorkflowRun::WORKFLOW[:long_read_mngs],
        }

        post :validate_sample_ids, params: validate_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)

        expect(json_response).not_to eq(nil)
        expect(json_response["validIds"]).to include(ont_sample.id)
        expect(json_response["invalidSampleNames"]).to include(good_sample_one.name, in_progress_sample.name, in_progress_ont_sample.name)
        expect(json_response["error"]).to be_nil
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

    describe "GET show" do
      it "can see sample report_v2" do
        project = create(:project, users: [@joe])
        sample = create(:sample, project: project)
        get :show, params: { id: sample.id }
        expect(response).to have_http_status :success
      end
    end

    describe "GET upload_credentials" do
      let(:fake_role_arn) { "dsfsdfsdfs" }
      let(:fake_access_key_id) { "123456789012" }
      let(:fake_region) { "fake-aws-region" }

      before do
        @project = create(:project, users: [@joe])
        input_file = InputFile.new
        input_file.name = "test.fasta"
        input_file.source = "test.fasta"
        input_file.parts = "test.fasta"
        input_file.source_type = "local"
        input_file.upload_client = "cli"
        input_file.file_type = "fastq"
        @sample = create(:sample, project: @project, name: "Test Sample One", input_files: [input_file], user: @joe)
        other_user = create(:user)
        unowned_project = create(:project, users: [other_user])
        @unowned_sample = create(:sample, project: unowned_project, name: "Test Sample Two", user: other_user)
        @uploaded_sample = create(:sample, project: @project, name: "Test Sample Three", status: Sample::STATUS_CHECKED, user: @joe)

        sign_in @joe
      end

      it "can get credentials for a sample" do
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('CLI_UPLOAD_ROLE_ARN').and_return(fake_role_arn)
        allow(ENV).to receive(:[]).with('AWS_REGION').and_return(fake_region)

        mock_client = Aws::STS::Client.new(stub_responses: true)
        creds = mock_client.stub_data(
          :assume_role,
          credentials: {
            access_key_id: fake_access_key_id,
          }
        )
        mock_client.stub_responses(:assume_role, creds)
        allow(AwsClient).to receive(:[]) { |_client|
          mock_client
        }

        get :upload_credentials, format: :json, params: { id: @sample.id }
        expect(response).to have_http_status :success
        creds = JSON.parse(response.body)
        expect(creds["access_key_id"]).to eq(fake_access_key_id)
        expect(creds["aws_region"]).to eq(fake_region)
        expect(mock_client.api_requests.length).to eq(1)
        request = mock_client.api_requests.first

        action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:CreateMultipartUpload",
          "s3:AbortMultipartUpload",
          "s3:ListMultipartUploadParts",
        ]
        object_arns = ["arn:aws:s3:::#{ENV['SAMPLES_BUCKET_NAME']}/samples/#{@project.id}/#{@sample.id}/fastqs/test.fasta"]
        policy = {
          Version: "2012-10-17",
          Statement: {
            Sid: "AllowSampleUploads",
            Effect: "Allow",
            Action: action,
            Resource: object_arns,
          },
        }
        expect(request[:params][:policy]).to eq(JSON.dump(policy))
      end

      it "returns not_found if user doesn't own sample" do
        get :upload_credentials, format: :json, params: { id: @unowned_sample.id }
        expect(response).to have_http_status :not_found
      end

      it "returns unauthorized if sample is already uploaded" do
        get :upload_credentials, format: :json, params: { id: @uploaded_sample.id }
        expect(response).to have_http_status :unauthorized
      end
    end

    describe "PUT #update" do
      before do
        project = create(:project, users: [@joe])
        @sample = create(:sample, project: project)

        sign_in @joe
      end

      context "Marking Sample as uploaded" do
        it "marks the Sample as uploaded" do
          expect(@sample.status).to eq(Sample::STATUS_CREATED)

          put :update, format: :json, params: { id: @sample.id, sample: { status: Sample::STATUS_UPLOADED } }

          expect(response).to have_http_status :success
          expect(@sample.reload.status).to eq(Sample::STATUS_CHECKED)
        end

        it "returns an error if not all input files appear on S3" do
          expect(@sample.status).to eq(Sample::STATUS_CREATED)
          expect(S3_CLIENT).to receive(:head_object).and_raise(Aws::S3::Errors::NotFound.new(nil, nil))

          put :update, format: :json, params: { id: @sample.id, sample: { status: Sample::STATUS_UPLOADED } }

          expect(response).to have_http_status :bad_request
          expect(@sample.status).to eq(Sample::STATUS_CREATED)
        end

        it "removes previously set upload errors" do
          @sample.update(upload_error: Sample::UPLOAD_ERROR_LOCAL_UPLOAD_STALLED)

          put :update, format: :json, params: { id: @sample.id, sample: { status: Sample::STATUS_UPLOADED } }

          sample = @sample.reload
          expect(response).to have_http_status :success
          expect(sample.status).to eq(Sample::STATUS_CHECKED)
          expect(sample.upload_error).to_not eq(Sample::UPLOAD_ERROR_LOCAL_UPLOAD_STALLED)
        end
      end
    end

    describe "GET #taxid_contigs_for_blast" do
      before do
        create(:taxon_lineage, tax_name: "Klebsiella pneumoniae", taxid: 573, genus_taxid: 570, superkingdom_taxid: 2)
        create(:taxon_lineage, tax_name: "Klebsiella", taxid: 570, genus_taxid: 570, superkingdom_taxid: 2)

        project = create(:project, users: [@joe])
        @sample = create(:sample, project: project)
        contig_lineage_json = "{\"NT\":[573, 570]}"

        # This sample has reads in NT for species taxid 573,
        # which belongs to genus 570.
        @pipeline_run = create(:pipeline_run,
                               sample: @sample,
                               sfn_execution_arn: "fake_sfn_execution_arn",
                               job_status: "CHECKED",
                               pipeline_version: 6.7,
                               contigs_data: [{
                                 species_taxid_nt: 573,
                                 genus_taxid_nt: 570,
                                 read_count: 101,
                                 lineage_json: contig_lineage_json,
                                 sequence: "ACGT",
                               }, {
                                 species_taxid_nt: 573,
                                 genus_taxid_nt: 570,
                                 read_count: 102,
                                 lineage_json: contig_lineage_json,
                                 sequence: "AC",
                               }, {
                                 species_taxid_nt: 573,
                                 genus_taxid_nt: 570,
                                 read_count: 103,
                                 lineage_json: contig_lineage_json,
                                 sequence: "ACGTACGT",
                               }, {
                                 species_taxid_nt: 570,
                                 genus_taxid_nt: 570,
                                 read_count: 104,
                                 lineage_json: contig_lineage_json,
                                 sequence: "ACGTAC",
                               },])

        sign_in @joe
      end

      it "returns up to the 3 longest contigs" do
        get :taxid_contigs_for_blast, format: :json, params: { id: @sample.id, taxid: 573, pipeline_version: @pipeline_run.pipeline_version, count_type: TaxonCount::COUNT_TYPE_NT }

        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        contigs = json_response["contigs"]

        expect(contigs.count).to eq(3)
        expect(contigs.map { |x| x["fasta_sequence"] }).to contain_exactly(
          ">:103:{\"NT\":[573, 570]}\nACGTACGT",
          ">:101:{\"NT\":[573, 570]}\nACGT", # note: the sequence "ACGTAC" is longer than this one but doesn't have taxid 573
          ">:102:{\"NT\":[573, 570]}\nAC"
        )
      end
    end

    describe "#taxon_five_longest_reads" do
      before do
        five_longest_reads = ">sequence1/1\nABC\n>sequence2/2\nABC\nDEFG\n>sequence3/1\nABCDEFGHIJK\n>sequence4/2\nABCDEFGHIJKLMN\n>sequence5/1\nABCDEFGHIJKLMNOPQRSTUVWXYZ"

        project = create(:project, users: [@joe])
        @sample = create(:sample, project: project)
        @pipeline_run = create(:pipeline_run,
                               sample: @sample,
                               sfn_execution_arn: "fake_sfn_execution_arn",
                               job_status: "CHECKED",
                               pipeline_version: 6.10,
                               wdl_version: "5.0")
        allow(S3Util).to receive(:get_s3_range).and_return(five_longest_reads)
      end

      it "should fetch the five longest reads from s3 and determine the shortest & longest alignment lengths" do
        get :taxon_five_longest_reads, format: :json, params: { id: @sample.id, taxid: 573, taxon_level: 1, pipeline_version: @pipeline_run.pipeline_version, count_type: TaxonCount::COUNT_TYPE_NT }

        expect(response).to have_http_status :success

        json_response = JSON.parse(response.body)
        reads = json_response["reads"]
        shortest_alignment_length = json_response["shortestAlignmentLength"]
        longest_alignment_length = json_response["longestAlignmentLength"]

        expect(reads.length).to eq(5)
        expect(shortest_alignment_length).to eq(3)
        expect(longest_alignment_length).to eq(26)
        # Second sequence has a line break in the middle of it. This test expects the entire sequence to be returned.
        expect(reads[1]).to eq(">sequence2/2\nABC\nDEFG\n")
      end
    end

    describe "POST #metadata_fields" do
      before do
        # Create @sample1 that is viewable by @joe
        # and add host_metadata_field1 to its project and host genome
        host_genome1 = create(:host_genome, name: "mock_host_genome1")
        @host_metadata_field1 = create(
          :metadata_field, name: "host_metadata_field1", base_type: MetadataField::STRING_TYPE
        )
        host_genome1.metadata_fields << @host_metadata_field1
        project1 = create(:project, users: [@joe])
        project1.metadata_fields.append(@host_metadata_field1)
        @sample1 = create(:sample, project: project1, host_genome: host_genome1)
      end

      it "should return an empty array if no sample ids are provided" do
        post :metadata_fields, params: { sampleIds: [] }, as: :json
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq([])
      end

      it "should return the correct metadata fields if 1 sample id is provided" do
        post :metadata_fields, params: { sampleIds: [@sample1.id] }, as: :json
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(1)
        expect(json_response[0]["key"]).to eq(@host_metadata_field1.name)
      end

      it "should only return metadata fields of viewable samples" do
        # Create @sample2 that is not viewable by @joe
        host_genome2 = create(:host_genome, name: "mock_host_genome2")
        host_metadata_field2 = create(
          :metadata_field, name: "host_metadata_field2", base_type: MetadataField::STRING_TYPE
        )
        host_genome2.metadata_fields << host_metadata_field2
        project2 = create(:project, users: [create(:user)])
        project2.metadata_fields.append(host_metadata_field2)
        sample2 = create(:sample, project: project2, host_genome: host_genome2)

        post :metadata_fields, params: { sampleIds: [@sample1.id, sample2.id] }, as: :json
        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)
        expect(json_response.length).to eq(1)
        expect(json_response[0]["key"]).to eq(@host_metadata_field1.name)
      end
    end

    describe "POST #validate_user_can_delete_objects" do
      before do
        @project = create(:project, users: [@joe])
        illumina = PipelineRun::TECHNOLOGY_INPUT[:illumina]
        @sample1 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "completed Illumina mNGs sample",
                                   pipeline_runs_data: [{ finalized: 1, technology: illumina }])

        @sample2 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "in-progress Illumina mNGS sample",
                                   pipeline_runs_data: [{ finalized: 0, technology: illumina }])

        @sample_ids = [@sample1.id, @sample2.id]

        # NextGen mocks: 1 workflow belonging to the user, the rest do not. Workflow UUID3 also
        # has a pointer to rails_sample_id, which means we should fetch the sample name from Rails.
        get_workflow_runs = JSON.parse({
          "data": {
            "workflow_runs": [
              { "id": "Workflow-UUID1", "owner_user_id": @joe.id, "rails_workflow_run_id": "123" },
              { "id": "Workflow-UUID2", "owner_user_id": 111, "rails_workflow_run_id": "456" },
              { "id": "Workflow-UUID3", "owner_user_id": 111, "rails_workflow_run_id": "456" },
            ],
            "workflow_run_entity_inputs": [
              { "workflow_run": { "id": "Workflow-UUID1" }, "input_entity_id": "Sample-UUID1" },
              { "workflow_run": { "id": "Workflow-UUID2" }, "input_entity_id": "Sample-UUID2" },
              { "workflow_run": { "id": "Workflow-UUID3" }, "input_entity_id": "Sample-UUID3" },
            ],
          },
        }.to_json, object_class: OpenStruct)

        get_samples = JSON.parse({
          "data": {
            "samples": [
              { "id": "Sample-UUID2", "rails_sample_id": nil, "name": "Sample 2 in NextGen" },
              { "id": "Sample-UUID3", "rails_sample_id": @sample2.id, "name": "Sample 3 in NextGen" },
            ],
          },
        }.to_json, object_class: OpenStruct)

        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetWorkflowRuns, { variables: { run_ids: ["Workflow-UUID1", "Workflow-UUID2", "Workflow-UUID3"] } }).and_return(get_workflow_runs)
        allow(CzidGraphqlFederation).to receive(:query_with_token).with(@joe.id, BulkDeletionServiceNextgen::GetSamples, { variables: { sample_ids: ["Sample-UUID2", "Sample-UUID3"] } }).and_return(get_samples)
      end

      context "when workflow is CG and NextGen UUIDs are passed in" do
        it "returns valid UUIDs and invalid sample names" do
          params = {
            workflow: "consensus-genome",
            selectedIds: ["Workflow-UUID1", "Workflow-UUID2", "Workflow-UUID3"],
          }

          post :validate_user_can_delete_objects, params: params
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:validIds]).to eq(["Workflow-UUID1"])
          expect(json_response[:invalidSampleNames]).to eq(["Sample 2 in NextGen", @sample2.name])
        end
      end

      context "when the workflow is mNGS and sample ids are passed in" do
        it "returns valid ids and invalid sample names for pipeline runs" do
          params = {
            workflow: "short-read-mngs",
            selectedIds: @sample_ids,
          }

          post :validate_user_can_delete_objects, params: params

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body, symbolize_names: true)

          expect(json_response[:error]).to be_nil
          expect(json_response[:validIds]).to eq([@sample1.id])
          expect(json_response[:invalidSampleNames]).to eq([@sample2.name])
        end

        it "raises error if workflow is missing" do
          params = {
            selectedIds: @sample_ids,
          }

          expect do
            post :validate_user_can_delete_objects, params: params
          end.to raise_error(DeletionValidationService::WorkflowMissingError)
        end

        it "returns empty arrays if no query ids are passed in" do
          params = {
            workflow: "short-read-mngs",
            selectedIds: [],
          }

          post :validate_user_can_delete_objects, params: params

          expect(response).to have_http_status(:ok)

          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to be_nil
          expect(json_response[:validIds]).to eq([])
          expect(json_response[:invalidSampleNames]).to eq([])
        end

        it "returns empty arrays if unexpected error occurs in validation service" do
          params = {
            workflow: "short-read-mngs",
            selectedIds: @sample_ids,
          }

          unexpected_error_response = {
            valid_ids: [],
            invalid_sample_ids: [],
            error: DeletionValidationService::DELETION_VALIDATION_ERROR,
          }

          allow(DeletionValidationService).to receive(:call).with(anything).and_return(unexpected_error_response)

          post :validate_user_can_delete_objects, params: params

          expect(response).to have_http_status(:ok)

          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to eq(DeletionValidationService::DELETION_VALIDATION_ERROR)
          expect(json_response[:validIds]).to eq([])
          expect(json_response[:invalidSampleNames]).to eq([])
        end
      end

      context "when workflow is CG/AMR and workflow run ids are passed in" do
        before do
          @completed_wr = create(:workflow_run, sample: @sample1, user_id: @joe.id, workflow: "consensus-genome", status: WorkflowRun::STATUS[:succeeded])
          @in_prog_wr = create(:workflow_run, sample: @sample2, user_id: @joe.id, workflow: "consensus-genome", status: WorkflowRun::STATUS[:running])
          @workflow_run_ids = [@completed_wr.id, @in_prog_wr.id]
        end

        it "returns valid ids and invalid sample names for workflow runs" do
          params = {
            workflow: "consensus-genome",
            selectedIds: @workflow_run_ids,
          }

          post :validate_user_can_delete_objects, params: params

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body, symbolize_names: true)

          expect(json_response[:error]).to be_nil
          expect(json_response[:validIds]).to eq([@completed_wr.id])
          expect(json_response[:invalidSampleNames]).to eq([@sample2.name])
        end

        it "raises error if workflow is missing" do
          params = {
            selectedIds: @workflow_run_ids,
          }

          expect do
            post :validate_user_can_delete_objects, params: params
          end.to raise_error(DeletionValidationService::WorkflowMissingError)
        end

        it "returns empty arrays if no query ids are passed in" do
          params = {
            workflow: "consensus-genome",
            selectedIds: [],
          }

          post :validate_user_can_delete_objects, params: params

          expect(response).to have_http_status(:ok)

          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to be_nil
          expect(json_response[:validIds]).to eq([])
          expect(json_response[:invalidSampleNames]).to eq([])
        end

        it "returns empty arrays if unexpected error occurs in validation service" do
          params = {
            workflow: "consensus-genome",
            selectedIds: @workflow_run_ids,
          }

          unexpected_error_response = {
            valid_ids: [],
            invalid_sample_ids: [],
            error: DeletionValidationService::DELETION_VALIDATION_ERROR,
          }

          allow(DeletionValidationService).to receive(:call).with(anything).and_return(unexpected_error_response)

          post :validate_user_can_delete_objects, params: params

          expect(response).to have_http_status(:ok)

          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to eq(DeletionValidationService::DELETION_VALIDATION_ERROR)
          expect(json_response[:validIds]).to eq([])
          expect(json_response[:invalidSampleNames]).to eq([])
        end
      end
    end
  end

  context "Admin user" do
    # create_users
    before do
      sign_in @admin
      @project = create(:project, users: [@admin], name: "Test Project")
    end

    describe "POST #validate" do
      before do
        @joe_project = create(:project, users: [@joe])
      end

      let(:good_sample_one) do
        create(:sample, project: @project, name: "Test Sample One", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      end

      let(:good_sample_two) do
        create(:sample, project: @project, name: "Test Sample Two", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      end

      let(:different_owner_sample) do
        create(:sample, project: @joe_project, name: "Joe Sample", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }])
      end

      it "should validate samples owned by any user" do
        validate_params = {
          sampleIds: [different_owner_sample],
        }

        post :validate_sample_ids, params: validate_params

        expect(response).to have_http_status(200)
        json_response = JSON.parse(response.body)

        expect(json_response).not_to eq(nil)
        expect(json_response["validIds"]).to include(different_owner_sample.id)
        expect(json_response["invalidSampleNames"]).to be_empty
        expect(json_response["error"]).to be_nil
      end
    end

    describe "POST #benchmark" do
      before do
        project = create(:project, users: [@admin])
        @benchmarking_project = create(:project, users: [@admin], name: "CZID Benchmarks")

        @sample_one = create(:sample, project: project, name: "Test Sample One")
        @pipeline_run_one = create(:pipeline_run, sample: @sample_one)

        @sample_two = create(:sample, project: project, name: "Test Sample Two")
        @pipeline_run_two = create(:pipeline_run, sample: @sample_two)
      end

      context "when user is an admin" do
        it "should create a new sample with a benchmark workflow run" do
          sample_ids = [@sample_one.id, @sample_two.id]
          allow(SfnBenchmarkPipelineDispatchService).to receive(:call).and_return(true)
          post :benchmark, params: { sampleIds: sample_ids, workflowBenchmarked: WorkflowRun::WORKFLOW[:short_read_mngs], projectId: @benchmarking_project.id }

          benchmark_sample = Sample.where(project: @benchmarking_project).last
          benchmark_workflow_run = WorkflowRun.where(sample: benchmark_sample).last

          expect(response).to have_http_status(:ok)
          expect(benchmark_workflow_run.workflow).to eq(WorkflowRun::WORKFLOW[:benchmark])
          expect(benchmark_workflow_run.get_input("run_ids").map(&:to_i)).to eq([@pipeline_run_one.id, @pipeline_run_two.id])
          expect(benchmark_workflow_run.get_input("workflow_benchmarked")).to eq(WorkflowRun::WORKFLOW[:short_read_mngs])
          expect(benchmark_workflow_run.get_input("ground_truth_file")).to eq(nil)
        end
      end
    end

    describe "GET #benchmark_ground_truth_files" do
      context "when user is an admin" do
        before do
          sign_in @admin
        end

        it "should return a list of ground truth file names from S3" do
          allow(Syscall).to receive(:pipe_with_output).and_return("\ntruth_file_1.txt\ntruth_file_2.txt")
          get :benchmark_ground_truth_files
          json_response = JSON.parse(response.body)

          expect(response).to have_http_status(:ok)
          expect(json_response["groundTruthFileNames"]).to eq(["truth_file_1.txt", "truth_file_2.txt"])
          expect(json_response["groundTruthFilesS3Bucket"]).to eq(BenchmarkWorkflowRun::AWS_S3_TRUTH_FILES_BUCKET)
        end
      end

      context "when user is not an admin" do
        before do
          sign_in @joe
        end

        it "should redirect to root path" do
          get :benchmark_ground_truth_files
          expect(response).to redirect_to root_path
        end
      end
    end

    describe "PUT #cancel_pipeline_run" do
      before do
        @project = create(:project, users: [@joe])
        @running_sample = create(:sample, project: @project, name: "Test Sample Two")
        @in_prog_pipeline_run = create(:pipeline_run,
                                       sample: @running_sample,
                                       sfn_execution_arn: "fake_sfn_execution_arn",
                                       s3_output_prefix: "fake_s3_prefix",
                                       job_status: "RUNNING",
                                       finalized: 0,
                                       pipeline_version: 6.10,
                                       wdl_version: "5.0")
      end

      context "when user is not an admin" do
        before do
          sign_in @joe
        end

        it "will not execute for non-admin users" do
          expect_any_instance_of(SfnExecution).not_to receive(:stop_execution)
          put :cancel_pipeline_run, params: { id: @running_sample.id }
        end
      end

      context "when user is an admin" do
        it "will try to cancel running pipelines" do
          expect_any_instance_of(SfnExecution).to receive(:stop_execution)
          put :cancel_pipeline_run, params: { id: @running_sample.id }
          expect(response).to redirect_to(pipeline_runs_sample_path(@running_sample.id))
        end

        it "will not try to cancel completed pipelines" do
          @completed_sample = create(:sample, project: @project, name: "Test Sample One")
          @completed_pipeline_run = create(:pipeline_run,
                                           sample: @completed_sample,
                                           sfn_execution_arn: "fake_sfn_execution_arn",
                                           s3_output_prefix: "s3_output_prefix",
                                           job_status: "CHECKED",
                                           finalized: 1,
                                           pipeline_version: 6.10,
                                           wdl_version: "5.0")
          expect_any_instance_of(SfnExecution).not_to receive(:stop_execution)
          put :cancel_pipeline_run, params: { id: @completed_sample.id }
          expect(response).to redirect_to(pipeline_runs_sample_path(@completed_sample.id))
        end
      end
    end
  end
end
