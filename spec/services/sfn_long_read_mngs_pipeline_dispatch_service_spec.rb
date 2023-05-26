require 'rails_helper'

RSpec.describe SfnLongReadMngsPipelineDispatchService, type: :service do
  let(:fake_samples_bucket) { "fake-samples-bucket" }
  let(:s3_samples_key_prefix) { "samples/%<project_id>s/%<sample_id>s" }
  let(:s3_sample_input_files_path) { "s3://#{fake_samples_bucket}/#{s3_samples_key_prefix}/fastqs/%<input_file_name>s" }
  let(:fake_account_id) { "123456789012" }
  let(:fake_sfn_arn) { "fake:sfn:arn" }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn" }
  let(:test_workflow_name) { WorkflowRun::WORKFLOW[:long_read_mngs] }
  let(:fake_wdl_version) { "0.1.1-beta" }
  let(:fake_alignment_config) { AlignmentConfig::DEFAULT_NAME }

  let(:fake_states_client) do
    Aws::States::Client.new(
      stub_responses: {
        start_execution: {
          execution_arn: fake_sfn_execution_arn,
          start_date: Time.zone.now,
        },
        list_tags_for_resource: {
          tags: [
            { key: "wdl_version", value: fake_wdl_version },
          ],
        },
      }
    )
  end

  let(:fake_sts_client) do
    Aws::STS::Client.new(
      stub_responses: {
        get_caller_identity: {
          account: fake_account_id,
        },
      }
    )
  end

  describe "#call" do
    context "for DNA samples" do
      before do
        @project = create(:project)
        @sample = create(:sample,
                         project: @project,
                         host_genome_name: "Human",
                         metadata_fields: { nucleotide_type: "DNA" },
                         subsample: 1_000_000)
        @pipeline_run = create(:pipeline_run, sample: @sample)
      end

      subject do
        SfnLongReadMngsPipelineDispatchService.call(@pipeline_run)
      end

      before do
        allow(ENV).to receive(:[]).and_call_original
        allow(ENV).to receive(:[]).with('SAMPLES_BUCKET_NAME').and_return(fake_samples_bucket)

        create(:app_config, key: AppConfig::SFN_SINGLE_WDL_ARN, value: fake_sfn_arn)
        create(:alignment_config, name: fake_alignment_config)

        Aws.config[:stub_responses] = true
        @mock_aws_clients = {
          states: fake_states_client,
          sts: fake_sts_client,
        }

        allow(AwsClient).to receive(:[]) { |client|
          @mock_aws_clients[client]
        }
      end

      context "when workflow has no version" do
        it "returns an exception" do
          @mock_aws_clients[:states].stub_responses(:list_tags_for_resource, tags: [])
          expect { subject }.to raise_error(SfnLongReadMngsPipelineDispatchService::SfnVersionMissingError, /WDL version for '#{test_workflow_name}' not set/)
        end
      end

      context "when workflow version is valid" do
        before do
          create(:app_config, key: format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: test_workflow_name), value: fake_wdl_version)
        end

        it "returns sfn input containing wdl workflow" do
          expect(subject).to include_json(
            sfn_input_json: {
              RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{@pipeline_run.workflow_version_tag}/run.wdl",
            }
          )
        end

        it "returns sfn input containing fastq input files" do
          expect(subject).to include_json(
            sfn_input_json: {
              Input: {
                Run: {
                  input_fastq: format(s3_sample_input_files_path, sample_id: @sample.id, project_id: @project.id, input_file_name: @sample.input_files.fastq[0].source),
                },
              },
            }
          )
        end

        it "returns sfn input containing correct default sfn parameters" do
          expect(subject).to include_json(
            sfn_input_json: {
              Input: {
                Run: {
                  minimap_human_db: SfnLongReadMngsPipelineDispatchService::HUMAN_S3_MINIMAP2_INDEX_PATH,
                  subsample_depth: @sample.subsample,
                  lineage_db: @pipeline_run.alignment_config.s3_lineage_path,
                  accession2taxid_db: @pipeline_run.alignment_config.s3_accession2taxid_path,
                  taxon_blacklist: @pipeline_run.alignment_config.s3_taxon_blacklist_path,
                  deuterostome_db: @pipeline_run.alignment_config.s3_deuterostome_db_path,
                  docker_image_id: "#{fake_account_id}.dkr.ecr.us-west-2.amazonaws.com/#{test_workflow_name}:v#{fake_wdl_version}",
                  minimap2_db: @pipeline_run.alignment_config.minimap2_long_db_path,
                  diamond_db: @pipeline_run.alignment_config.diamond_db_path,
                  s3_wd_uri: "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample.sample_path}/#{@pipeline_run.id}/#{@pipeline_run.version_key_subpath}",
                  nt_info_db: @pipeline_run.alignment_config.s3_nt_info_db_path,
                },
              },
            }
          )
        end

        it "returns sfn input containing output prefix" do
          expect(subject).to include_json(
            sfn_input_json: {
              OutputPrefix: "s3://#{ENV['SAMPLES_BUCKET_NAME']}/#{@sample.sample_path}/#{@pipeline_run.id}",
            }
          )
        end

        it "returns sfn input containing the correct index file path for host filtering" do
          expect(subject).to include_json(
            sfn_input_json: {
              Input: {
                Run: {
                  minimap_host_db: @sample.host_genome.s3_minimap2_dna_index_path,
                },
              },
            }
          )
        end

        it "raises original exception when start-execution or dispatch fails" do
          @mock_aws_clients[:states].stub_responses(:start_execution, Aws::States::Errors::InvalidArn.new(nil, nil))
          expect { subject }.to raise_error(Aws::States::Errors::InvalidArn)
        end
      end

      context "for RNA samples" do
        before do
          @project = create(:project)
          @sample = create(:sample,
                           project: @project,
                           host_genome_name: "Human",
                           metadata_fields: { nucleotide_type: "RNA" })
          @pipeline_run = create(:pipeline_run, sample: @sample)

          create(:app_config, key: format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: test_workflow_name), value: fake_wdl_version)
        end

        subject do
          SfnLongReadMngsPipelineDispatchService.call(@pipeline_run)
        end

        it "returns sfn input containing the correct index file path for host filtering" do
          expect(subject).to include_json(
            sfn_input_json: {
              Input: {
                Run: {
                  minimap_host_db: @sample.host_genome.s3_minimap2_rna_index_path,
                },
              },
            }
          )
        end
      end
    end
  end
end
