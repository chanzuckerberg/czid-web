require 'rails_helper'

RSpec.describe "Sample request", type: :request do
  create_users

  let(:short_read_mngs) { WorkflowRun::WORKFLOW[:short_read_mngs] }
  let(:illumina) { PipelineRun::TECHNOLOGY_INPUT[:illumina] }

  context 'Joe' do
    before do
      sign_in @joe
    end

    describe "/samples/index_v2" do
      before do
        @project = create(:project, users: [@joe, @admin])
        @sample1 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "completed Illumina mNGs sample 1",
                                   initial_workflow: short_read_mngs,
                                   created_at: 1.week.ago)
        @pr1 = create(:pipeline_run, sample: @sample1, technology: illumina, finalized: 1)
        @sample2 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "completed Illumina mNGs sample 2",
                                   initial_workflow: short_read_mngs,
                                   created_at: 2.weeks.ago)
        @pr2 = create(:pipeline_run, sample: @sample2, technology: illumina, finalized: 1)

        @params = {
          domain: "my_data",
          workflow: short_read_mngs,
          listAllIds: true,
          basic: false,
          format: :json,
        }
      end

      it "filters out samples in the process of deleting" do
        # stub out call so we don't actually hard delete the objects
        allow(HardDeleteObjects).to receive(:perform)
        BulkDeletionService.call(
          object_ids: [@sample1.id],
          user: @joe,
          workflow: short_read_mngs
        )

        @sample1.reload
        expect(@sample1.deleted_at).to be_within(1.minute).of(Time.now.utc)

        get "/samples/index_v2", params: @params
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        samples_response = json_response["samples"]
        expect(samples_response.map { |sample| sample["id"] }).not_to include(@sample1.id)
        expect(json_response["samples"].length).to be(1)
        expect(json_response["all_samples_ids"]).not_to include(@sample1.id)
      end

      it "does not filter out samples that have nil deleted_at field" do
        get "/samples/index_v2", params: @params

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        samples_response = json_response["samples"]
        expect(samples_response.map { |sample| sample["id"] }).to include(@sample1.id, @sample2.id)
        expect(json_response["samples"].length).to be(2)
        expect(json_response["all_samples_ids"]).to contain_exactly(@sample2.id, @sample1.id)
      end

      it "does not filter out samples in the process of uploading" do
        sample_uploading = create(:sample, project: @project,
                                           user: @joe,
                                           name: "uploading_sample",
                                           initial_workflow: short_read_mngs,
                                           status: Sample::STATUS_CREATED,
                                           created_at: 1.month.ago)

        get "/samples/index_v2", params: @params

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        samples_response = json_response["samples"]
        expect(samples_response.map { |sample| sample["id"] }).to include(sample_uploading.id)

        expect(json_response["all_samples_ids"]).to include(sample_uploading.id)
      end
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
              file_type: "fastq",
            },
            {
              source_type: "local",
              source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          length: 2,
          name: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__17",
          project_id: @project.id,
          do_not_process: false,
          workflows: [WorkflowRun::WORKFLOW[:short_read_mngs]],
        }

        @sample_params_wgs = {
          client: "web",
          host_genome_id: hg.id,
          host_genome_name: hg.name,
          technology: illumina_technology,
          input_files_attributes: [
            {
              source_type: "local",
              source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz",
              parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              source_type: "local",
              source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              source_type: "local",
              source: "primer.bed",
              parts: "primer.bed",
              upload_client: "web",
              file_type: "primer_bed",
            },
            {
              source_type: "local",
              source: "ref.fasta",
              parts: "ref.fasta",
              upload_client: "web",
              file_type: "reference_sequence",
            },
          ],
          length: 2,
          name: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__17",
          project_id: @project.id,
          do_not_process: false,
          primer_bed: "primer.bed",
          ref_fasta: "ref.fasta",
          taxon_name: "generic virus",
          workflows: [WorkflowRun::WORKFLOW[:consensus_genome], WorkflowRun::WORKFLOW[:short_read_mngs]],
        }

        @sample_params_sc2_cg = {
          client: "web",
          host_genome_id: hg.id,
          host_genome_name: hg.name,
          technology: illumina_technology,
          input_files_attributes: [
            {
              source_type: "local",
              source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz",
              parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz",
              upload_client: "web",
              file_type: "fastq",
            },
            {
              source_type: "local",
              source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              upload_client: "web",
              file_type: "fastq",
            },
          ],
          length: 2,
          name: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__17",
          project_id: @project.id,
          do_not_process: false,
          workflows: [WorkflowRun::WORKFLOW[:consensus_genome]],
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

      it "should successfully save CG WGS workflow_runs with the correct inputs_json" do
        @sample_params_wgs[:workflows] = [WorkflowRun::WORKFLOW[:consensus_genome]]
        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params_wgs], metadata: @metadata_params, client: @client_params, format: :json }
        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        sample_id = json_response["sample_ids"][0]
        test_sample = Sample.find(sample_id)
        expect(test_sample.status).to eq(Sample::STATUS_CREATED)
        expect(test_sample.pipeline_execution_strategy).to eq(nil)

        workflow_run = WorkflowRun.find_by(sample_id: sample_id)
        inputs_json = JSON.parse(workflow_run.inputs_json)
        expect(inputs_json["primer_bed"] == "primer.bed")
        expect(inputs_json["ref_fasta"] == "ref.fasta")
        expect(inputs_json["taxon_name"] == "generic virus")
      end

      it "should successfully kickoff mNGS and WGS together" do
        @sample_params_wgs[:workflows] = [WorkflowRun::WORKFLOW[:consensus_genome], WorkflowRun::WORKFLOW[:short_read_mngs]]
        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params_wgs], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        sample_id = json_response["sample_ids"][0]
        test_sample = Sample.find(sample_id)
        expect(test_sample.status).to eq(Sample::STATUS_CREATED)
        expect(test_sample.pipeline_execution_strategy).to eq(nil)

        workflow_run = WorkflowRun.find_by(sample_id: sample_id)
        # check that initial workflow has been set to short-read-mngs and that workflow is consensus-genome

        expect(test_sample.initial_workflow == "short-read-mngs")
        expect(workflow_run.workflow == "consensus-genome")
      end

      it "should successfully kickoff SC2 CG workflow runs and set the correct inputs_json" do
        post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params_sc2_cg], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        sample_id = json_response["sample_ids"][0]

        test_sample = Sample.find(sample_id)
        expect(test_sample.status).to eq(Sample::STATUS_CREATED)
        expect(test_sample.pipeline_execution_strategy).to eq(nil)
        workflow_run = WorkflowRun.find_by(sample_id: sample_id)

        expect(workflow_run.workflow == "consensus-genome")
        inputs_json = JSON.parse(workflow_run.inputs_json)
        expect(inputs_json["accession_id"] == ConsensusGenomeWorkflowRun::SARS_COV_2_ACCESSION_ID)
        expect(inputs_json["accession_name"] == "Severe acute respiratory syndrome coronavirus 2 isolate Wuhan-Hu-1, complete genome")
        expect(inputs_json["taxon_id"] == 2_697_049)
        expect(inputs_json["taxon_name"] == "Severe acute respiratory syndrome coronavirus 2")
        expect(inputs_json["technology"] == illumina_technology)
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
        @cg_wr = create(:workflow_run, sample: @cg_sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], deprecated: false)
        create(:workflow_run, sample: @cg_sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], deprecated: false)
        create(:workflow_run, sample: @cg_sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome], deprecated: true)
        @amr_sample = create(
          :sample,
          project: @project,
          initial_workflow: "amr"
        )
        @amr_wr = create(:workflow_run, sample: @amr_sample, workflow: WorkflowRun::WORKFLOW[:amr], deprecated: false)
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

      it "filters out soft-deleted data" do
        timestamp = Time.now.utc
        @short_read_mngs_sample.update(deleted_at: timestamp)
        @long_read_mngs_sample.update(deleted_at: timestamp)
        @cg_wr.update(deleted_at: timestamp)
        @amr_wr.update(deleted_at: timestamp)

        get "/samples/stats.json", params: { domain: @domain }

        expect(response.content_type).to include("application/json")
        expect(response).to have_http_status(:ok)

        stats_response = JSON.parse(response.body)
        expect(stats_response["countByWorkflow"]).to include(
          WorkflowRun::WORKFLOW[:short_read_mngs] => 0,
          WorkflowRun::WORKFLOW[:long_read_mngs] => 0,
          WorkflowRun::WORKFLOW[:consensus_genome] => 1,
          WorkflowRun::WORKFLOW[:amr] => 0
        )
        expect(stats_response["count"]).to eq 2
        expect(stats_response["projectCount"]).to eq 1
        expect(stats_response["avgTotalReads"]).to eq 0
        expect(stats_response["avgAdjustedRemainingReads"]).to eq 0
      end
    end

    describe "/samples/bulk_delete" do
      before do
        @project = create(:project, users: [@joe])
        @illumina = PipelineRun::TECHNOLOGY_INPUT[:illumina]
        @nanopore = PipelineRun::TECHNOLOGY_INPUT[:nanopore]
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
          @pr4 = create(:pipeline_run, sample: @sample4, technology: @nanopore, finalized: 1)
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
            deleted_run_ids: [@pr1.id, @pr2.id],
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
            deleted_run_ids: [@completed_wr.id, @failed_wr.id],
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

    describe "samples/:id/show" do
      let(:short_read_mngs) { WorkflowRun::WORKFLOW[:short_read_mngs] }
      let(:consensus_genome) { WorkflowRun::WORKFLOW[:consensus_genome] }
      let(:illumina) { PipelineRun::TECHNOLOGY_INPUT[:illumina] }
      before do
        @project = create(:project, users: [@joe])
        @sample1 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "completed Illumina mNGs sample 1")
        @pr1 = create(:pipeline_run,
                      sample: @sample1,
                      technology: illumina,
                      finalized: 1,
                      deleted_at: Time.now.utc)
      end

      context "when the sample has been soft deleted" do
        before do
          allow(HardDeleteObjects).to receive(:perform)
          BulkDeletionService.call(
            object_ids: [@sample1.id],
            user: @joe,
            workflow: short_read_mngs
          )
        end

        it "redirects to my_data" do
          get "/samples/#{@sample1.id}"
          expect(response).to redirect_to(my_data_path)
        end
      end
    end

    describe "samples/search_suggestions" do
      let(:illumina) { PipelineRun::TECHNOLOGY_INPUT[:illumina] }
      before do
        @project = create(:project, users: [@joe])
        @sample1 = create(:sample, project: @project,
                                   user: @joe,
                                   name: "completed Illumina mNGs sample 1")
        @pr1 = create(:pipeline_run,
                      sample: @sample1,
                      technology: illumina,
                      finalized: 1)
      end

      it "does not return soft-deleted samples" do
        allow(HardDeleteObjects).to receive(:perform)
        BulkDeletionService.call(
          object_ids: [@sample1.id],
          user: @joe,
          workflow: short_read_mngs
        )

        get "/search_suggestions", params: { query: "completed" }
        res = JSON.parse(response.body)
        expect(res).to be_empty
      end

      it "does return non-soft-deleted samples" do
        get "/search_suggestions", params: { query: "completed" }
        res = JSON.parse(response.body)
        samples_shown = res["Sample"]["results"].map { |h| h["sample_id"] }.flatten
        expect(samples_shown).to include(@sample1.id)
      end
    end

    describe "samples/bulk_kickoff_workflow_runs" do
      let(:fake_sfn_arn) { "fake:sfn:arn" }
      let(:test_workflow_name) { WorkflowRun::WORKFLOW[:amr] }
      let(:fake_wdl_version) { "10.0.0" }
      let(:fake_card_folder) { "card-1-wildcard-2" }

      before do
        host_genome1 = create(:host_genome, name: "Human")
        @project = create(:project, users: [@joe])
        @sample1 = create(:sample, project: @project, name: "Test Sample One", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }], host_genome: host_genome1)
        @sample2 = create(:sample, project: @project, name: "Test Sample Two", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }], host_genome: host_genome1)
        @sample3 = create(:sample, project: @project, name: "Test Sample Three", pipeline_runs_data: [{ finalized: 1, job_status: PipelineRun::STATUS_CHECKED }], host_genome: host_genome1)
        create(:app_config, key: AppConfig::SFN_SINGLE_WDL_ARN, value: fake_sfn_arn)
        create(:app_config, key: format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: test_workflow_name), value: fake_wdl_version)
        create(:app_config, key: AppConfig::CARD_FOLDER, value: fake_card_folder)
      end

      it "should raise an error for unrecognized workflow types" do
        params = {
          sampleIds: [@sample1.id, @sample2.id],
          workflow: "bad_workflow",
        }
        expect do
          post "/samples/bulk_kickoff_workflow_runs", params: params
        end.to raise_error(SamplesHelper::WorkflowNotFoundError)
      end

      context "When AMR workflow is specified" do
        it "should create and dispatch AMR workflow runs for each sample" do
          params = {
            sampleIds: [@sample1.id, @sample2.id],
            workflow: WorkflowRun::WORKFLOW[:amr],
          }

          post "/samples/bulk_kickoff_workflow_runs", params: params

          expect(response).to have_http_status(200)
          json_response = JSON.parse(response.body)
          wr1 = @sample1.workflow_runs.last
          wr2 = @sample2.workflow_runs.last
          expect(wr1.workflow).to eq(WorkflowRun::WORKFLOW[:amr])
          expect(wr2.workflow).to eq(WorkflowRun::WORKFLOW[:amr])
          expect(json_response["newWorkflowRunIds"]).to contain_exactly(wr1.id, wr2.id)
        end

        it "should deprecate previous AMR workflows and allow rerunning of completed AMR workflow" do
          @completed_wr = create(:workflow_run, sample_id: @sample3.id, workflow: WorkflowRun::WORKFLOW[:amr], deprecated: false, status: WorkflowRun::STATUS[:succeeded])

          params = {
            sampleIds: [@sample1.id, @sample2.id, @sample3.id],
            workflow: WorkflowRun::WORKFLOW[:amr],
          }

          post "/samples/bulk_kickoff_workflow_runs", params: params

          expect(response).to have_http_status(200)
          json_response = JSON.parse(response.body)
          wr1 = @sample1.workflow_runs.last
          wr2 = @sample2.workflow_runs.last
          wr3 = @sample3.workflow_runs.last
          expect(wr1.workflow).to eq(WorkflowRun::WORKFLOW[:amr])
          expect(wr2.workflow).to eq(WorkflowRun::WORKFLOW[:amr])
          expect(wr3.workflow).to eq(WorkflowRun::WORKFLOW[:amr])
          expect(json_response["newWorkflowRunIds"]).to contain_exactly(wr1.id, wr2.id, wr3.id)
          expect(wr3.id).not_to eq(@completed_wr.id)
          expect(@completed_wr.reload.deprecated?).to be(true)
        end

        it "should allow the sample to kick off AMR if the sample has existing CG runs" do
          create(:workflow_run,
                 sample_id: @sample1.id,
                 workflow: WorkflowRun::WORKFLOW[:consensus_genome],
                 status: WorkflowRun::STATUS[:succeeded])
          create(:workflow_run,
                 sample_id: @sample2.id,
                 workflow: WorkflowRun::WORKFLOW[:consensus_genome],
                 status: WorkflowRun::STATUS[:running])
          params = {
            sampleIds: [@sample1.id, @sample2.id],
            workflow: WorkflowRun::WORKFLOW[:amr],
          }

          post "/samples/bulk_kickoff_workflow_runs", params: params

          expect(response).to have_http_status(200)
          json_response = JSON.parse(response.body)
          wr1 = @sample1.workflow_runs.last
          wr2 = @sample2.workflow_runs.last
          expect(wr1.workflow).to eq(WorkflowRun::WORKFLOW[:amr])
          expect(wr2.workflow).to eq(WorkflowRun::WORKFLOW[:amr])
          expect(json_response["newWorkflowRunIds"]).to contain_exactly(wr1.id, wr2.id)
        end

        context "When one or more samples has an in-progress AMR workflow" do
          before do
            @in_prog_wr = create(:workflow_run, sample_id: @sample3.id, workflow: WorkflowRun::WORKFLOW[:amr], deprecated: false, status: WorkflowRun::STATUS[:running])
          end

          it "should not kick off AMR for sample with in-progress AMR workflow" do
            params = {
              sampleIds: [@sample1.id, @sample2.id, @sample3.id],
              workflow: WorkflowRun::WORKFLOW[:amr],
            }

            post "/samples/bulk_kickoff_workflow_runs", params: params

            expect(response).to have_http_status(200)
            json_response = JSON.parse(response.body)
            wr1 = @sample1.workflow_runs.last
            wr2 = @sample2.workflow_runs.last
            wr3 = @sample3.workflow_runs.last
            expect(wr1.workflow).to eq(WorkflowRun::WORKFLOW[:amr])
            expect(wr2.workflow).to eq(WorkflowRun::WORKFLOW[:amr])
            expect(wr3.workflow).to eq(WorkflowRun::WORKFLOW[:amr])
            expect(json_response["newWorkflowRunIds"]).to contain_exactly(wr1.id, wr2.id)
            expect(wr3.id).to eq(@in_prog_wr.id)
            expect(@in_prog_wr.reload.deprecated?).to be(false)
          end

          it "should exit quietly if no samples are eligible for AMR" do
            params = {
              sampleIds: [@sample3.id],
              workflow: WorkflowRun::WORKFLOW[:amr],
            }
            post "/samples/bulk_kickoff_workflow_runs", params: params
            expect(response).to have_http_status(200)
            json_response = JSON.parse(response.body)
            expect(json_response["newWorkflowRunIds"]).to eq([])
          end
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
              file_type: "fastq",
            },
            {
              source_type: "local",
              source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz",
              upload_client: "web",
              file_type: "fastq",
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
