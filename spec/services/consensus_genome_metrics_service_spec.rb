require "rails_helper"

RSpec.describe ConsensusGenomeMetricsService, type: :service do
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project) }
  let(:workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:consensus_genome]) }
  let(:workflow_run_corona) do
    create(:workflow_run,
           sample: sample,
           workflow: WorkflowRun::WORKFLOW[:consensus_genome],
           inputs_json: { accession_id: "MN908947.3" }.to_json)
  end

  let(:quast_data) { "GC (%)\t38.00\nReference length\t15000\nFake Row\t-1" }
  let(:quast_formatted) do
    {
      gc_percent: 38.0,
      n_actg: 12_345,
      percent_genome_called: 82.3,
      reference_genome_length: 15_000,
    }
  end

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
  let(:stats_formatted) do
    {
      n_actg: 12_345,
      n_ambiguous: 0,
      n_missing: 20,
      percent_identity: 91.9,
      ref_snps: 1000,
      total_reads: 654_321,
    }
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
    context "when the accession id is not for SARS-CoV-2" do
      it "fetches the primary metrics and quast metrics" do
        expect(subject).to receive(:add_primary_metrics)
        expect(subject).to receive(:add_quast_metrics)

        subject.send(:generate)
      end
    end

    context "when the accession id IS for SARS-CoV-2" do
      subject { ConsensusGenomeMetricsService.new(workflow_run_corona) }

      it "fetches the primary metrics and quast metrics" do
        expect(subject).to receive(:add_primary_metrics)
        expect(subject).to receive(:add_quast_metrics)

        subject.send(:generate)
      end

      it "handles the error when the output is not available" do
        expect(workflow_run_corona).to receive(:output).with(ConsensusGenomeWorkflowRun::OUTPUT_STATS).and_return(stats_data)
        expect(workflow_run_corona).to receive(:output).with(ConsensusGenomeWorkflowRun::OUTPUT_QUAST).and_return(quast_data)

        expect(subject.send(:generate)).to eq(consolidated_data)
      end
    end

    it "handles the error when the SFN description is not found" do
      expect(subject).to receive(:add_primary_metrics).and_raise(SfnExecution::SfnDescriptionNotFoundError, "fake_path")
      expect(LogUtil).to receive(:log_error)

      expect(subject.send(:generate)).to eq(nil)
    end
  end

  describe "#add_primary_metrics" do
    it "correctly formats the custom stats metrics" do
      expect(workflow_run).to receive(:output).with(ConsensusGenomeWorkflowRun::OUTPUT_STATS).and_return(stats_data)

      expect(subject.send(:add_primary_metrics, {})).to eq(stats_formatted)
    end
  end

  describe "#add_quast_metrics" do
    it "correctly formats the quast metrics" do
      expect(workflow_run).to receive(:output).with(ConsensusGenomeWorkflowRun::OUTPUT_QUAST).and_return(quast_data)

      expect(subject.send(:add_quast_metrics, { n_actg: 12_345 })).to eq(quast_formatted)
    end

    it "throws an exception if n_actg wasn't already present" do
      expect(workflow_run).to receive(:output).with(ConsensusGenomeWorkflowRun::OUTPUT_QUAST).and_return(quast_data)

      expect { subject.send(:add_quast_metrics, {}) }.to raise_error(NoMethodError)
    end
  end
end
