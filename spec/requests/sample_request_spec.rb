require 'rails_helper'

RSpec.describe "Sample request", type: :request do
  create_users

  context 'Joe' do
    before do
      sign_in @joe
    end

    describe "/samples/bulk_upload_with_metadata" do
      let(:illumina_technology) { ConsensusGenomeWorkflowRun::TECHNOLOGY_INPUT[:illumina] }

      before do
        # Sample setup
        @project = create(:public_project, users: [@joe])
        create(:alignment_config, name: AlignmentConfig::DEFAULT_NAME)
        hg = create(:host_genome)
        @sample_params = {
          client: "web",
          host_genome_id: hg.id,
          host_genome_name: hg.name,
          input_files_attributes: [
            {
              source_type: "local",
              source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz",
              parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz",
              upload_client: "web",
            },
            {
              source_type: "local",
              source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              upload_client: "web",
            },
          ],
          length: 2,
          name: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__17",
          project_id: @project.id,
          do_not_process: false,
          workflows: [WorkflowRun::WORKFLOW[:short_read_mngs]],
        }

        @metadata_params = {
          "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__17" => {
            "sex" => "Female",
            "age" => 100,
            "host_genome" => "Synthetic",
            "water_control" => "No",
            "sample_type" => "CSF",
            "nucleotide_type" => "DNA",
            "collection_date" => "2020-01",
            "collection_location_v2" => { "title" => "Santa Barbara, CA", "name" => "Santa Barbara, CA" },
          },
        }

        @client_params = "web"
      end

      describe "sample input files" do
        it "returns input file attributes" do
          post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

          expect(response.content_type).to include("application/json")
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)

          resp_input_files = json_response["samples"][0]["input_files"]

          resp_input_files.each do |resp_input_file|
            input_file = InputFile.find(resp_input_file["id"])
            expect(resp_input_file["id"]).to eq(input_file.id)
            expect(resp_input_file["name"]).to eq(input_file.name)
            expect(resp_input_file["presigned_url"]).to eq(input_file.presigned_url)
            expect(resp_input_file["s3_bucket"]).to eq(ENV["SAMPLES_BUCKET_NAME"])
            expect(resp_input_file["s3_file_path"]).to eq(input_file.file_path)
          end
        end
      end

      it "should keep pipeline_execution_strategy flag nil in the sample when no flag is passed" do
        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        expect(test_sample.status).to eq(Sample::STATUS_CREATED)
        expect(test_sample.pipeline_execution_strategy).to eq(nil)
      end

      it "should properly add the pipeline_execution_strategy flag, step_function, to the pipeline run when no flag is passed" do
        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)

        # we have to call the method manually in testing,
        # to bypass the file upload process
        test_sample.kickoff_pipeline

        pipeline_run = test_sample.pipeline_runs[0]
        expect(pipeline_run.pipeline_execution_strategy).to eq("step_function")
      end

      it "should properly add the pipeline_execution_strategy flag, step_function, to the sample" do
        @sample_params[:pipeline_execution_strategy] = "step_function"

        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        expect(test_sample.status).to eq(Sample::STATUS_CREATED)
        expect(test_sample.pipeline_execution_strategy).to eq("step_function")
      end

      it "should properly add the pipeline_execution_strategy flag, step_function, to the pipeline run" do
        @sample_params[:pipeline_execution_strategy] = "step_function"

        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)

        # we have to call the method manually in testing,
        # to bypass the file upload process
        test_sample.kickoff_pipeline

        pipeline_run = test_sample.pipeline_runs[0]
        expect(pipeline_run.pipeline_execution_strategy).to eq("step_function")
      end

      it "should set subsample or max_input_fragments if sample is uploaded to biohub project ids" do
        AppConfigHelper.set_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_SUBSAMPLE, 100)
        AppConfigHelper.set_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_MAX_INPUT_FRAGMENTS, 50)
        AppConfigHelper.set_json_app_config(AppConfig::SUBSAMPLE_WHITELIST_PROJECT_IDS, [@project.id])

        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        expect(test_sample.subsample).to eq(100)
        expect(test_sample.max_input_fragments).to eq(50)
      end

      it "should set subsample or max_input_fragments if multiple project ids are specified" do
        AppConfigHelper.set_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_SUBSAMPLE, 100)
        AppConfigHelper.set_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_MAX_INPUT_FRAGMENTS, 50)
        AppConfigHelper.set_json_app_config(AppConfig::SUBSAMPLE_WHITELIST_PROJECT_IDS, [@project.id, @project.id + 1, @project.id + 2, @project.id + 3])

        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        expect(test_sample.subsample).to eq(100)
        expect(test_sample.max_input_fragments).to eq(50)
      end

      it "should not set subsample or max_input_fragments if they are nil" do
        AppConfigHelper.set_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_SUBSAMPLE, nil)
        AppConfigHelper.set_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_MAX_INPUT_FRAGMENTS, nil)
        AppConfigHelper.set_json_app_config(AppConfig::SUBSAMPLE_WHITELIST_PROJECT_IDS, [@project.id])

        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        expect(test_sample.max_input_fragments).to eq(nil)
        expect(test_sample.subsample).to eq(nil)
      end

      it "should not set subsample or max_input_fragments if sample is uploaded to different project" do
        AppConfigHelper.set_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_SUBSAMPLE, 100)
        AppConfigHelper.set_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_MAX_INPUT_FRAGMENTS, 50)
        AppConfigHelper.set_json_app_config(AppConfig::SUBSAMPLE_WHITELIST_PROJECT_IDS, [@project.id + 1])

        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        expect(test_sample.max_input_fragments).to eq(nil)
        expect(test_sample.subsample).to eq(nil)
      end

      it "should set subsample or max_input_fragments if project default is set" do
        @project.update(subsample_default: 101, max_input_fragments_default: 102)

        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        expect(test_sample.subsample).to eq(101)
        expect(test_sample.max_input_fragments).to eq(102)
      end

      it "subsample or max_input_fragments in admin options should be ignored for normal users" do
        sample_params = @sample_params.dup
        # These admin options are only valid if the user is an admin.
        sample_params[:subsample] = 103
        sample_params[:max_input_fragments] = 104

        post "/samples/bulk_upload_with_metadata", params: { samples: [sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        expect(test_sample.subsample).to eq(nil)
        expect(test_sample.max_input_fragments).to eq(nil)
      end

      it "whitelist defaults should take precedence over project defaults" do
        AppConfigHelper.set_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_SUBSAMPLE, 100)
        AppConfigHelper.set_app_config(AppConfig::SUBSAMPLE_WHITELIST_DEFAULT_MAX_INPUT_FRAGMENTS, 50)
        AppConfigHelper.set_json_app_config(AppConfig::SUBSAMPLE_WHITELIST_PROJECT_IDS, [@project.id])

        @project.update(subsample_default: 101, max_input_fragments_default: 102)

        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        expect(test_sample.subsample).to eq(100)
        expect(test_sample.max_input_fragments).to eq(50)
      end

      it "should set the 'main' pipeline workflow by default" do
        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        # we have to call the method manually in testing,
        # to bypass the file upload process
        test_sample.kickoff_pipeline
        created_pipeline_run = PipelineRun.find_by(sample_id: sample_id)

        expect(test_sample.pipeline_runs).to include(created_pipeline_run)
      end

      it "should properly create the consensus genome workflow" do
        sample_params = @sample_params.dup
        sample_params[:technology] = illumina_technology
        sample_params[:wetlab_protocol] = ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL[:artic]
        sample_params[:workflows] = ["consensus-genome"]
        post "/samples/bulk_upload_with_metadata", params: { samples: [sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        created_workflow_run = WorkflowRun.find_by(sample_id: sample_id)

        expect(test_sample.workflow_runs).to include(created_workflow_run)
      end

      it "should fail with a bogus pipeline workflow selection" do
        sample_params = @sample_params.dup
        bogus_pipeline_workflow = "foobar"
        sample_params[:technology] = illumina_technology
        sample_params[:workflows] = [bogus_pipeline_workflow]
        post "/samples/bulk_upload_with_metadata", params: { samples: [sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response["sample_ids"]).to be_empty
      end

      it "should properly set the selected wetlab protocol" do
        sample_params = @sample_params.dup
        sample_params[:technology] = illumina_technology
        sample_params[:wetlab_protocol] = ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL[:artic]
        sample_params[:workflows] = [WorkflowRun::WORKFLOW[:consensus_genome]]
        post "/samples/bulk_upload_with_metadata", params: { samples: [sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        inputs_json = JSON.parse(test_sample&.workflow_runs&.last&.inputs_json || "{}")
        expect(inputs_json).to include("wetlab_protocol" => ConsensusGenomeWorkflowRun::WETLAB_PROTOCOL[:artic])
      end

      it "should succeed without a wetlab protocol for mNGS runs" do
        sample_params = @sample_params.dup
        sample_params[:technology] = illumina_technology
        sample_params[:workflows] = [WorkflowRun::WORKFLOW[:short_read_mngs]]
        sample_params[:wetlab_protocol] = nil
        post "/samples/bulk_upload_with_metadata", params: { samples: [sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
      end
    end

    describe "/samples/stats" do
      let(:domain) { "my_data" }

      before do
        @domain = "my_data"
        @project = create(:project, users: [@joe])
        @mngs_sample = create(:sample, project: @project, initial_workflow: WorkflowRun::WORKFLOW[:short_read_mngs])
        @cg_sample = create(
          :sample,
          project: @project,
          initial_workflow: WorkflowRun::WORKFLOW[:consensus_genome],
          workflow_runs_data: [{ workflow: WorkflowRun::WORKFLOW[:consensus_genome] }]
        )
        @cg_sample_without_workflow_run = create(
          :sample,
          project: @project,
          initial_workflow: WorkflowRun::WORKFLOW[:consensus_genome]
        )
        @amr_sample = create(
          :sample,
          project: @project,
          initial_workflow: "amr",
          workflow_runs_data: [
            { workflow: WorkflowRun::WORKFLOW[:amr] },
            { workflow: WorkflowRun::WORKFLOW[:amr], deprecated: true },
          ]
        )
        @amr_sample2 = create(:sample, project: @project, initial_workflow: "amr", workflow_runs_data: [{ workflow: WorkflowRun::WORKFLOW[:amr] }])
        @amr_sample_without_workflow_run = create(:sample, project: @project, initial_workflow: "amr")
      end

      it "returns requested sample stats" do
        get "/samples/stats.json", params: { domain: @domain }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)

        stats_response = JSON.parse(response.body)
        expect(stats_response["countByWorkflow"]).to include(
          WorkflowRun::WORKFLOW[:short_read_mngs] => 1,
          WorkflowRun::WORKFLOW[:consensus_genome] => 2,
          WorkflowRun::WORKFLOW[:amr] => 3
        )
        expect(stats_response["consensusGenomesCount"]).to eq 1
        expect(stats_response["count"]).to eq 6
        expect(stats_response["projectCount"]).to eq 1
        expect(stats_response["avgTotalReads"]).to eq 0
        expect(stats_response["avgAdjustedRemainingReads"]).to eq 0
      end
    end
  end

  context 'admin' do
    before do
      sign_in @admin
    end

    context "with a pre-existing project" do
      before do
        # Sample setup
        @project = create(:public_project, users: [@admin])
        create(:alignment_config, name: AlignmentConfig::DEFAULT_NAME)
        hg = create(:host_genome)
        @sample_params = {
          client: "web",
          host_genome_id: hg.id,
          host_genome_name: hg.name,
          input_files_attributes: [
            {
              source_type: "local",
              source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz",
              parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz",
              upload_client: "web",
            },
            {
              source_type: "local",
              source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              upload_client: "web",
            },
          ],
          length: 2,
          name: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__17",
          project_id: @project.id,
          do_not_process: false,
        }

        @metadata_params = {
          "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__17" => {
            "sex" => "Female",
            "age" => 100,
            "host_genome" => "Synthetic",
            "water_control" => "No",
            "sample_type" => "CSF",
            "nucleotide_type" => "DNA",
            "collection_date" => "2020-01",
            "collection_location_v2" => { "title" => "Santa Barbara, CA", "name" => "Santa Barbara, CA" },
          },
        }

        @client_params = "web"
      end

      it "subsample or max_input_fragments in the sample params should take precedence if project default is set" do
        @project.update(subsample_default: 101, max_input_fragments_default: 102)

        sample_params = @sample_params.dup
        # These admin options are only valid if the user is an admin.
        sample_params[:subsample] = 103
        sample_params[:max_input_fragments] = 104

        post "/samples/bulk_upload_with_metadata", params: { samples: [sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        expect(test_sample.subsample).to eq(103)
        expect(test_sample.max_input_fragments).to eq(104)
      end
    end
  end
end
