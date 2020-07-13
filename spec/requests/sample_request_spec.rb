require 'rails_helper'

RSpec.describe "Sample request", type: :request do
  create_users

  context 'Joe' do
    before do
      sign_in @joe
    end

    context "with a pre-existing project" do
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
            { source_type: "local", source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz", parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz" },
            { source_type: "local", source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz", parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz" },
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

        # don't actually do any remote work
        allow_any_instance_of(Sample).to receive(:set_presigned_url_for_local_upload).and_return(true)
      end

      describe "when we create a sample via sample upload flow" do
        it "should keep pipeline_execution_strategy flag nil in the sample when no flag is passed" do
          post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

          expect(response.content_type).to eq("application/json")
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          sample_id = json_response["sample_ids"][0]

          test_sample = Sample.find(sample_id)
          expect(test_sample.status).to eq(Sample::STATUS_CREATED)
          expect(test_sample.pipeline_execution_strategy).to eq(nil)
        end

        it "should properly add the pipeline_execution_strategy flag, step_function, to the pipeline run when no flag is passed" do
          post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

          expect(response.content_type).to eq("application/json")
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

        it "should properly add the pipeline_execution_strategy flag, directed_acyclic_graph, to the sample" do
          @sample_params[:pipeline_execution_strategy] = "directed_acyclic_graph"

          post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

          expect(response.content_type).to eq("application/json")
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          sample_id = json_response["sample_ids"][0]

          test_sample = Sample.find(sample_id)
          expect(test_sample.status).to eq(Sample::STATUS_CREATED)
          expect(test_sample.pipeline_execution_strategy).to eq("directed_acyclic_graph")
        end

        it "should properly add the pipeline_execution_strategy flag, directed_acyclic_graph, to the pipeline run" do
          @sample_params[:pipeline_execution_strategy] = "directed_acyclic_graph"

          post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

          expect(response.content_type).to eq("application/json")
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          sample_id = json_response["sample_ids"][0]

          test_sample = Sample.find(sample_id)

          # we have to call the method manually in testing,
          # to bypass the file upload process
          test_sample.kickoff_pipeline

          pipeline_run = test_sample.pipeline_runs[0]
          expect(pipeline_run.pipeline_execution_strategy).to eq("directed_acyclic_graph")
        end

        it "should properly add the pipeline_execution_strategy flag, step_function, to the sample" do
          @sample_params[:pipeline_execution_strategy] = "step_function"

          post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

          expect(response.content_type).to eq("application/json")
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

          expect(response.content_type).to eq("application/json")
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

          expect(response.content_type).to eq("application/json")
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

          expect(response.content_type).to eq("application/json")
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

          expect(response.content_type).to eq("application/json")
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

          expect(response.content_type).to eq("application/json")
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

          expect(response.content_type).to eq("application/json")
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

          expect(response.content_type).to eq("application/json")
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

          expect(response.content_type).to eq("application/json")
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          sample_id = json_response["sample_ids"][0]

          test_sample = Sample.find(sample_id)
          expect(test_sample.subsample).to eq(100)
          expect(test_sample.max_input_fragments).to eq(50)
        end

        it "should set the 'main' pipeline workflow by default" do
          post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

          expect(response.content_type).to eq("application/json")
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          sample_id = json_response["sample_ids"][0]

          test_sample = Sample.find(sample_id)
          expect(test_sample.temp_pipeline_workflow).to eq("main")
        end

        it "should properly set the consensus_genome pipeline workflow" do
          sample_params = @sample_params.dup
          sample_params[:workflows] = ["consensus_genome"]
          post "/samples/bulk_upload_with_metadata", params: { samples: [sample_params], metadata: @metadata_params, client: @client_params, format: :json }

          expect(response.content_type).to eq("application/json")
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          sample_id = json_response["sample_ids"][0]

          test_sample = Sample.find(sample_id)
          expect(test_sample.temp_pipeline_workflow).to eq("consensus_genome")
        end

        it "should fail with a bogus pipeline workflow selection" do
          sample_params = @sample_params.dup
          sample_params[:workflows] = ["foobar"]
          post "/samples/bulk_upload_with_metadata", params: { samples: [sample_params], metadata: @metadata_params, client: @client_params, format: :json }

          expect(response.content_type).to eq("application/json")
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          expect(json_response["sample_ids"]).to be_empty
          expect(json_response["errors"]).to eq([{ "temp_pipeline_workflow" => ["is not included in the list"] }])
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
            { source_type: "local", source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz", parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz" },
            { source_type: "local", source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz", parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz" },
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

        # don't actually do any remote work
        allow_any_instance_of(Sample).to receive(:set_presigned_url_for_local_upload).and_return(true)
      end

      it "subsample or max_input_fragments in the sample params should take precedence if project default is set" do
        @project.update(subsample_default: 101, max_input_fragments_default: 102)

        sample_params = @sample_params.dup
        # These admin options are only valid if the user is an admin.
        sample_params[:subsample] = 103
        sample_params[:max_input_fragments] = 104

        post "/samples/bulk_upload_with_metadata", params: { samples: [sample_params], metadata: @metadata_params, client: @client_params, format: :json }

        expect(response.content_type).to eq("application/json")
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
