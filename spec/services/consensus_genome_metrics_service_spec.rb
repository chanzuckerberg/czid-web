require "rails_helper"

RSpec.describe ConsensusGenomeMetricsService, type: :service do
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project) }
  let(:workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }

  let(:quast_data) { "GC (%)\t38.00\nReference length\t15000\nFake Row\t-1" }
  let(:stats_data) do
    {
      fake_extra: -1,
      n_actg: 12_345,
      n_ambiguous: 0,
      n_missing: 20,
      ref_snps: 1000,
      total_reads: 654_321,
    }.to_json
  end
  let(:consolidated_data) do
    {
      gc_percent: 38.0,
      n_actg: 12_345,
      n_ambiguous: 0,
      n_missing: 20,
      percent_genome_called: 82.3,
      percent_identity: 91.9,
      ref_snps: 1000,
      reference_genome_length: 15_000,
      total_reads: 654_321,
    }
  end

  let(:memory_store) { ActiveSupport::Cache.lookup_store(:memory_store) }

  before do
    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
    }
    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }
    @mock_aws_clients[:s3].stub_responses(:get_object, lambda { |context|
      fake_bucket[context.params[:key]] || "NoSuchKey"
    })
  end

  subject { ConsensusGenomeMetricsService.new(workflow_run) }

  describe "#call" do
    it "calls the generate method" do
      expect_any_instance_of(ConsensusGenomeMetricsService).to receive(:generate).and_return(consolidated_data)
      expect(ConsensusGenomeMetricsService.call(workflow_run)).to eq(consolidated_data)
    end
  end

  describe "#generate" do
    it "fetches and formats metrics" do
      allow(workflow_run).to receive(:output).with(ConsensusGenomeWorkflowRun::OUTPUT_QUAST).exactly(1).times.and_return(quast_data)
      allow(workflow_run).to receive(:output).with(ConsensusGenomeWorkflowRun::OUTPUT_STATS).exactly(1).times.and_return(stats_data)
      expect(subject).to receive(:format_metrics).with(quast_data, stats_data)

      subject.send(:generate)
    end
  end

  describe "#format_metrics" do
    it "correctly formats consolidated metrics with only allowed keys" do
      expect(subject.send(:format_metrics, quast_data, stats_data)).to eq(consolidated_data)
    end
  end
end
