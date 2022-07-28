require 'rails_helper'

RSpec.describe SfnPhyloTreeNgDispatchService, type: :service do
  let(:fake_samples_bucket) { "fake-samples-bucket" }
  let(:fake_account_id) { "123456789012" }
  let(:fake_sfn_arn) { "fake:sfn:arn" }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn" }
  let(:test_workflow_name) { "phylotree-ng" }
  let(:fake_wdl_version) { "10.0.0" }
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

  let(:project) { create(:project) }
  let(:sample_one) { create(:sample, project: project) }
  let(:pr_one) { create(:pipeline_run, sample: sample_one) }
  let(:sample_two) { create(:sample, project: project) }
  let(:pr_two) { create(:pipeline_run, sample: sample_two) }

  let(:phylotree_ng) do
    create(:phylo_tree_ng,
           name: "test_tree",
           status: WorkflowRun::STATUS[:created],
           inputs_json: { additional_reference_accession_ids: ["NC_012532.1", "NC_035889.1"], pipeline_run_ids: [pr_one.id, pr_two.id], tax_id: 1, superkingdom_name: "viruses" },
           pipeline_runs: [pr_one, pr_two])
  end

  describe "#call" do
    subject do
      SfnPhyloTreeNgDispatchService.call(phylotree_ng)
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

    context "when phylo tree ng has no version" do
      it "returns an exception" do
        @mock_aws_clients[:states].stub_responses(:list_tags_for_resource, tags: [])
        expect { subject }.to raise_error(SfnPhyloTreeNgDispatchService::SfnVersionMissingError, /WDL version for phylotree-ng not set/)
      end
    end

    context "with WDL version" do
      before do
        create(:app_config, key: format(AppConfig::WORKFLOW_VERSION_TEMPLATE, workflow_name: test_workflow_name), value: fake_wdl_version)
      end

      it "returns correct json" do
        expect(subject).to include_json({})
      end

      it "returns sfn input containing sample information" do
        expect(subject).to include_json(
          sfn_input_json: {
            Input: {
              Run: {
                samples: [
                  {
                    workflow_run_id: pr_one.id,
                    combined_contig_summary: pr_one.s3_file_for("contig_counts"),
                    contig_fasta: pr_one.contigs_fasta_s3_path,
                    sample_name: sample_one.name,
                  },
                  {
                    workflow_run_id: pr_two.id,
                    combined_contig_summary: pr_two.s3_file_for("contig_counts"),
                    contig_fasta: pr_two.contigs_fasta_s3_path,
                    sample_name: sample_two.name,
                  },
                ],
              },
            },
          }
        )
      end

      it "return sfn input containing reference information" do
        expect(subject).to include_json(
          sfn_input_json: {
            Input: {
              Run: {
                additional_reference_accession_ids: [
                  "NC_012532.1",
                  "NC_035889.1",
                ],
                reference_taxon_id: 1,
                superkingdom_name: "viruses",
              },
            },
          }
        )
      end

      it "returns sfn input containing wdl workflow" do
        expect(subject).to include_json(
          sfn_input_json: {
            RUN_WDL_URI: "s3://#{S3_WORKFLOWS_BUCKET}/#{phylotree_ng.version_tag}/run.wdl",
          }
        )
      end

      it "kicks off the Phylo Tree run and updates the PhyloTreeNg as expected" do
        subject
        expect(phylotree_ng).to have_attributes(
          sfn_execution_arn: fake_sfn_execution_arn,
          status: WorkflowRun::STATUS[:running],
          s3_output_prefix: "s3://#{fake_samples_bucket}/phylotree-ng/#{phylotree_ng.id}/results"
        )
      end

      context "when start-execution or dispatch fails" do
        it "raises original exception" do
          @mock_aws_clients[:states].stub_responses(:start_execution, Aws::States::Errors::InvalidArn.new(nil, nil))
          expect { subject }.to raise_error(Aws::States::Errors::InvalidArn)
          expect(phylotree_ng).to have_attributes(sfn_execution_arn: nil, status: WorkflowRun::STATUS[:failed])
        end
      end
    end
  end
end
