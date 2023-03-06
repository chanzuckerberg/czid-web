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
        @short_read_mngs_sample = create(:sample, project: @project, initial_workflow: WorkflowRun::WORKFLOW[:short_read_mngs])
        @long_read_mngs_sample = create(:sample, project: @project, initial_workflow: WorkflowRun::WORKFLOW[:long_read_mngs])
        @cg_sample = create(
          :sample,
          project: @project,
          initial_workflow: WorkflowRun::WORKFLOW[:consensus_genome]
        )
        create(:workflow_run, sample: @cg_sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], deprecated: false)
        create(:workflow_run, sample: @cg_sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], deprecated: false)
        create(:workflow_run, sample: @cg_sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], deprecated: true)
        @amr_sample = create(
          :sample,
          project: @project,
          initial_workflow: "amr"
        )
        create(:workflow_run, sample: @amr_sample, workflow: WorkflowRun::WORKFLOW[:amr], deprecated: false)
        create(:workflow_run, sample: @amr_sample, workflow: WorkflowRun::WORKFLOW[:amr], deprecated: true)
      end

      it "returns requested sample stats" do
        get "/samples/stats.json", params: { domain: @domain }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)

        stats_response = JSON.parse(response.body)
        expect(stats_response["countByWorkflow"]).to include(
          WorkflowRun::WORKFLOW[:short_read_mngs] => 1,
          WorkflowRun::WORKFLOW[:long_read_mngs] => 1,
          WorkflowRun::WORKFLOW[:consensus_genome] => 2,
          WorkflowRun::WORKFLOW[:amr] => 1
        )
        expect(stats_response["count"]).to eq 4
        expect(stats_response["projectCount"]).to eq 1
        expect(stats_response["avgTotalReads"]).to eq 0
        expect(stats_response["avgAdjustedRemainingReads"]).to eq 0
      end
    end

    describe "/samples/bulk_delete" do
      before do
        @project = create(:project, users: [@joe])
        @illumina = PipelineRun::TECHNOLOGY_INPUT[:illumina]
        @illumina = PipelineRun::TECHNOLOGY_INPUT[:nanopore]
      end

      context "when sample ids are passed in for mNGS workflows" do
        before do
          @sample1 = create(:sample, project: @project,
                                     user: @joe,
                                     name: "completed Illumina mNGs sample 1")
          @pr1 = create(:pipeline_run, sample: @sample1, technology: @illumina, finalized: 1)

          @sample2 = create(:sample, project: @project,
                                     user: @joe,
                                     name: "completed Illumina mNGs sample 2")
          @pr2 = create(:pipeline_run, sample: @sample2, technology: @illumina, finalized: 1)

          @sample3 = create(:sample, project: @project,
                                     user: @joe,
                                     name: "in-progress Illumina mNGS sample")
          @pr3 = create(:pipeline_run, sample: @sample3, technology: @illumina, finalized: 0)

          @sample4 = create(:sample, project: @project,
                                     user: @joe,
                                     name: "completed nanopore mNGs sample")
          @pr4 = create(:pipeline_run, sample: @sample4, technology: @illumina, finalized: 0)
        end

        it "returns empty array with error if error is raised in DeletionValidationService" do
          params = {
            workflow: "short-read-mngs",
            selectedIds: [@sample1.id, @sample3.id],
          }

          unexpected_error_response = {
            valid_ids: [],
            invalid_sample_ids: [],
            error: DeletionValidationService::DELETION_VALIDATION_ERROR,
          }

          allow(DeletionValidationService).to receive(:call).with(anything).and_return(unexpected_error_response)

          post "/samples/bulk_delete", params: params
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to eq(DeletionValidationService::DELETION_VALIDATION_ERROR)
          expect(json_response[:deletedIds]).to be_empty
        end

        it "returns empty array with error when some samples are illumina and some are nanopore" do
          params = {
            workflow: "short-read-mngs",
            selectedIds: [@sample1.id, @sample2.id, @sample4.id],
          }

          validation_response = {
            error: nil,
            valid_ids: [@sample1.id, @sample2.id],
            invalid_sample_ids: [@sample4.id],
          }

          expect(DeletionValidationService).to receive(:call).with(anything).and_return(validation_response)

          post "/samples/bulk_delete", params: params

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to eq("Bulk delete failed: not all objects valid for deletion")
          expect(json_response[:deletedIds]).to be_empty
        end

        it "returns empty array with error if not all ids are valid for deletion" do
          params = {
            workflow: "short-read-mngs",
            selectedIds: [@sample1.id, @sample2.id, @sample3.id],
          }

          validation_response = {
            error: nil,
            valid_ids: [@sample1.id, @sample2.id],
            invalid_sample_ids: [@sample3.id],
          }

          expect(DeletionValidationService).to receive(:call).with(anything).and_return(validation_response)

          post "/samples/bulk_delete", params: params

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to eq("Bulk delete failed: not all objects valid for deletion")
          expect(json_response[:deletedIds]).to be_empty
        end

        it "calls services with valid sample ids and returns deleted pipeline run ids" do
          params = {
            workflow: "short-read-mngs",
            selectedIds: [@sample1.id, @sample2.id],
          }

          validation_service_response = {
            error: nil,
            valid_ids: [@sample1.id, @sample2.id],
            invalid_sample_ids: [],
          }

          deletion_service_response = {
            error: nil,
            deleted_ids: [@pr1.id, @pr2.id],
          }
          expect(DeletionValidationService).to receive(:call).with(anything).and_return(validation_service_response)

          expect(BulkDeletionService).to receive(:call).with(anything).and_return(deletion_service_response)

          post "/samples/bulk_delete", params: params

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to be_nil
          expect(json_response[:deletedIds]).to contain_exactly(@pr1.id, @pr2.id)
        end
      end

      context "when workflow run ids are passed in for CG/AMR workflows" do
        let(:consensus_genome) { WorkflowRun::WORKFLOW[:consensus_genome] }
        let(:amr) { WorkflowRun::WORKFLOW[:amr] }

        before do
          @sample1 = create(:sample, project: @project, user: @joe, name: "Joe sample 1")
          @completed_wr = create(:workflow_run, sample: @sample1, workflow: consensus_genome, status: WorkflowRun::STATUS[:succeeded])

          @sample2 = create(:sample, project: @project, user: @joe, name: "Joe sample 2")
          @failed_wr = create(:workflow_run, sample: @sample2, workflow: consensus_genome, status: WorkflowRun::STATUS[:failed])

          @sample3 = create(:sample, project: @project, user: @joe, name: "Joe sample 3")
          @in_prog_wr = create(:workflow_run, sample: @sample3, workflow: consensus_genome, status: WorkflowRun::STATUS[:running])

          @sample4 = create(:sample, project: @project, user: @joe, name: "Joe sample 4")
          @completed_amr_wr = create(:workflow_run, sample: @sample1, workflow: amr, status: WorkflowRun::STATUS[:succeeded])
        end

        it "returns empty array with error if error is raised in DeletionValidationService" do
          params = {
            workflow: "consensus-genome",
            selectedIds: [@completed_wr.id, @failed_wr.id],
          }

          unexpected_error_response = {
            valid_ids: [],
            invalid_sample_ids: [],
            error: DeletionValidationService::DELETION_VALIDATION_ERROR,
          }

          allow(DeletionValidationService).to receive(:call).with(anything).and_return(unexpected_error_response)

          post "/samples/bulk_delete", params: params
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to eq(DeletionValidationService::DELETION_VALIDATION_ERROR)
          expect(json_response[:deletedIds]).to be_empty
        end

        it "returns empty array with error if not all workflow run ids are valid for deletion" do
          params = {
            workflow: "consensus-genome",
            selectedIds: [@completed_wr.id, @in_prog_wr.id],
          }

          validation_response = {
            error: nil,
            valid_ids: [@completed_wr.id],
            invalid_sample_ids: [@in_prog_wr.sample_id],
          }

          expect(DeletionValidationService).to receive(:call).with(anything).and_return(validation_response)

          post "/samples/bulk_delete", params: params

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to eq("Bulk delete failed: not all objects valid for deletion")
          expect(json_response[:deletedIds]).to be_empty
        end

        it "returns empty array with error when some runs are CG and some are AMR" do
          params = {
            workflow: "consensus-genome",
            selectedIds: [@completed_wr.id, @completed_amr_wr.id],
          }

          validation_response = {
            error: nil,
            valid_ids: [@completed_wr.id],
            invalid_sample_ids: [@completed_amr_wr.sample_id],
          }

          expect(DeletionValidationService).to receive(:call).with(anything).and_return(validation_response)

          post "/samples/bulk_delete", params: params

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to eq("Bulk delete failed: not all objects valid for deletion")
          expect(json_response[:deletedIds]).to be_empty
        end

        it "calls services with valid workflow run ids and returns deleted workflow run ids" do
          params = {
            workflow: "consensus-genome",
            selectedIds: [@completed_wr.id, @failed_wr.id],
          }

          validation_service_response = {
            error: nil,
            valid_ids: [@completed_wr.id, @failed_wr.id],
            invalid_sample_ids: [],
          }

          deletion_service_response = {
            error: nil,
            deleted_ids: [@completed_wr.id, @failed_wr.id],
          }

          expect(DeletionValidationService).to receive(:call).with(anything).and_return(validation_service_response)

          expect(BulkDeletionService).to receive(:call).with(anything).and_return(deletion_service_response)

          post "/samples/bulk_delete", params: params

          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body, symbolize_names: true)
          expect(json_response[:error]).to be_nil
          expect(json_response[:deletedIds]).to contain_exactly(@completed_wr.id, @failed_wr.id)
        end
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
