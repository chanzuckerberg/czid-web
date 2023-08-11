require 'factory_bot'
require_relative 'seed_resource'

module SeedResource
  class Samples < Base
    def initialize(sample_attributes)
      @sample_attributes = sample_attributes
    end

    def seed
      @sample_attributes.map do |attributes|
        workflow_runs_data = attributes.delete(:workflow_runs_data)
        pipeline_runs_data = attributes.delete(:pipeline_runs_data)

        add_default_sample_attributes(attributes)
        add_input_files_attributes(attributes)
        add_default_metadata_fields(attributes)

        sample = find_or_create(:sample, attributes)
        if sample.present?
          if workflow_runs_data.present?
            workflow_runs_data.each do |workflow_run_data|
              SeedResource::WorkflowRuns.seed(sample, workflow_run_data)
            end
          end

          if pipeline_runs_data.present?
            SeedResource::PipelineRuns.seed(sample, pipeline_runs_data)
          end
        end
        sample
      end
    end

    private

    def add_input_files_attributes(attributes)
      attributes[:input_files_attributes] = Array.new(2).map do
        sample_name = attributes[:name].downcase.tr(" ", "_")
        {
          name: "#{sample_name}.fastq.gz",
          source: "#{sample_name}.fastq.gz",
          upload_client: "web",
          file_type: "fastq",
          source_type: "local",
        }
      end
    end

    def add_default_metadata_fields(attributes)
      attributes[:metadata_fields] = {
        collection_location_v2: "Los Angeles, USA",
        sample_type: "CSF",
        nucleotide_type: "DNA",
        collection_date: "2021-04",
        water_control: "No",
      }
    end

    def add_default_sample_attributes(attributes)
      attributes[:status] = Sample::STATUS_CHECKED
      attributes[:host_genome_name] = "Human"
      attributes[:upload_error] = nil
      attributes[:initial_workflow] = "short-read-mngs"
    end
  end
end
