require 'rails_helper'
require 'json'

SAMPLES_TEST_BUCKET = "samples-test-bucket"
SAMPLES_S3_PATH = "s3://#{SAMPLES_TEST_BUCKET}/samples/%<project_id>s/%<sample_id>s/fastqs/%<input_file_name>s"

RSpec.describe SfnPipelineService, type: :service do
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project) }
  let(:pipeline_run) {
    create(:pipeline_run, sample: sample, pipeline_run_stages_data: [
      { name: "Host Filtering", step_number: 1 },
      { name: "Alignment", step_number: 2 },
      { name: "Post Process", step_number: 3 },
      { name: "Experimental", step_number: 4 },
    ])
  }

  context "generate_wdl_input" do
    subject {
      SfnPipelineService.new(pipeline_run).generate_wdl_input({})
    }

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
            fastqs_0: SAMPLES_S3_PATH % {
              sample_id: sample.id,
              project_id: project.id,
              input_file_name: sample.input_files[0].source
            },
            fastqs_1: SAMPLES_S3_PATH % {
              sample_id: sample.id,
              project_id: project.id,
              input_file_name: sample.input_files[1].source
            }
          }
        }
      )
    end

    it "contains dag jsons" do
      expect(subject).to include_json(
        dag_jsons: {
          PipelineRunStage::DAG_NAME_HOST_FILTER => {},
          PipelineRunStage::DAG_NAME_ALIGNMENT => {},
          PipelineRunStage::DAG_NAME_POSTPROCESS => {},
          PipelineRunStage::DAG_NAME_EXPERIMENTAL => {}
        }
      )
    end
  end

  # add function to test the call method
end