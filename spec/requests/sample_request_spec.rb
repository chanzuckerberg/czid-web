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
        project = create(:public_project, users: [@joe])
        create(:alignment_config, name: AlignmentConfig::DEFAULT_NAME)
        @sample_params = {
          client: "web",
          host_genome_id: 1,
          host_genome_name: "Human",
          input_files_attributes: [
            { source_type: "local", source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz", parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R1.fastq.gz" },
            { source_type: "local", source: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz", parts: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__R2.fastq.gz" },
          ],
          length: 2,
          name: "norg_6__nacc_27__uniform_weight_per_organism__hiseq_reads__v6__17",
          project_id: project.id,
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
        it "should properly add the pipeline_execution_strategy flag, directed_acyclic_graph, to the sample when no flag is passed" do
          post "/samples/bulk_upload_with_metadata", params: { samples: [@sample_params], metadata: @metadata_params, client: @client_params, format: :json }

          expect(response.content_type).to eq("application/json")
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          sample_id = json_response["sample_ids"][0]

          test_sample = Sample.find(sample_id)
          expect(test_sample.status).to eq(Sample::STATUS_CREATED)
          expect(test_sample.pipeline_execution_strategy).to eq("directed_acyclic_graph")
        end

        it "should properly add the pipeline_execution_strategy flag, directed_acyclic_graph, to the pipeline run when no flag is passed" do
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
      end
    end
  end
end
