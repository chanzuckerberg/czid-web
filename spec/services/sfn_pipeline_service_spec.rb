require 'rails_helper'
require 'json'

SAMPLES_TEST_BUCKET = "samples-test-bucket".freeze
SAMPLES_S3_PATH = "s3://#{SAMPLES_TEST_BUCKET}/samples/%<project_id>s/%<sample_id>s/fastqs/%<input_file_name>s".freeze

RSpec.describe SfnPipelineService, type: :service do
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project) }
  let(:pipeline_run) do
    create(:pipeline_run, sample: sample, pipeline_run_stages_data: [
             { name: "Host Filtering", step_number: 1 },
             { name: "Alignment", step_number: 2 },
             { name: "Post Process", step_number: 3 },
             { name: "Experimental", step_number: 4 },
           ])
  end

  context "generate_wdl_input" do
    subject do
      SfnPipelineService.new(pipeline_run).generate_wdl_input({})
    end

    before do
      allow(ENV).to receive(:[]).and_call_original
      allow(ENV).to receive(:[]).with('SAMPLES_BUCKET_NAME').and_return(SAMPLES_TEST_BUCKET)
    end

    it "returns correct a json" do
      expect(subject).to include_json({})
    end

    # TODO: let to test single and paired input files
    it "contains fastq input files" do
      expect(subject).to include_json(
        Input: {
          HostFilter: {
            fastqs_0: format(SAMPLES_S3_PATH, sample_id: sample.id, project_id: project.id, input_file_name: sample.input_files[0].source),
            fastqs_1: format(SAMPLES_S3_PATH, sample_id: sample.id, project_id: project.id, input_file_name: sample.input_files[1].source),
          },
        }
      )
    end

    it "uploads per-stage dag json files" do
      raise "Needs test implementation"
    end

    it "uploads per-stage wdl files" do
      raise "Needs test implementation"
    end
  end

  context "upload_inputs_and_generate_paths" do
    it "generates correct paths" do
      raise "Needs test implementation"
    end
  end

  context "convert_dag_json_to_wdl" do
    it "generates exception in case of error" do
      raise "Needs test implementation"
    end
  end
end
