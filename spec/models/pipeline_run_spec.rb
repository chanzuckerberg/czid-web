require "rails_helper"

# Constants for testing loading contigs into db
CONTIG2TAXID = {
  "NODE_1438_length_226_cov_1.660819" => { "NT" => "38289" }, "NODE_2_length_2504_cov_2.191915" => { "NT" => "485" },
}.freeze

CONTIGS = ">NODE_1438_length_226_cov_1.660819
GTTATTCACTTATGGA
>NODE_2_length_2504_cov_2.191915
CTGTTACACGATTCAAC".freeze

CONTIG_STATS = {
  "NODE_1438_length_226_cov_1.660819": 4,
  "NODE_2_length_2504_cov_2.191915": 92,
}.freeze

describe PipelineRun, type: :model do
  let(:fake_output_prefix) { "s3://fake-output-prefix" }
  let(:fake_sfn_name) { "fake_sfn_name" }
  let(:fake_sfn_arn) { "fake:sfn:arn".freeze }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn:#{fake_sfn_name}".freeze }
  let(:fake_error) { "fake_error" }
  let(:failed_sfn_status) { "FAILED" }
  let(:fake_sfn_status) { "SUCCESS" }
  let(:fake_sfn_execution_description) do
    {
      execution_arn: fake_sfn_arn,
      input: JSON.dump(OutputPrefix: fake_output_prefix),
      # AWS SDK rounds to second
      start_date: Time.zone.now.round,
      state_machine_arn: fake_sfn_execution_arn,
      status: fake_sfn_status,
    }
  end
  let(:fake_error_sfn_execution_description) do
    {
      execution_arn: fake_sfn_arn,
      input: JSON.dump(OutputPrefix: fake_output_prefix),
      start_date: Time.zone.now.round,
      state_machine_arn: fake_sfn_execution_arn,
      status: failed_sfn_status,
    }
  end
  let(:fake_error_sfn_execution_history) do
    {
      events: [
        {
          id: 1,
          execution_failed_event_details: { error: fake_error },
          timestamp: Time.zone.now,
          type: "dummy_type",
        },
      ],
    }
  end
  let(:fake_wdl_version) { "999".freeze }
  let(:fake_dag_version) { "9.999".freeze }

  create_users

  before do
    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
      states: Aws::States::Client.new(stub_responses: true),
    }
    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }
  end

  context "#update_job_status" do
    let(:user) { build_stubbed(:user) }
    let(:sample) { build_stubbed(:sample, user: user) }
    let(:pipeline_run) { build_stubbed(:pipeline_run, sample: sample, pipeline_version: "3.7", executed_at: 1.minute.ago) }
    before { expect(pipeline_run).to receive(:save!) }

    context "when all stages complete successfully" do
      before { allow(pipeline_run).to receive(:active_stage).and_return(nil) }

      it "changes status to finalized" do
        pipeline_run.update_job_status

        expect(pipeline_run).to have_attributes(finalized: 1, job_status: "CHECKED")
        expect(pipeline_run.time_to_finalized).to be > 0
      end
    end

    context "when a stage completes with an error" do
      let(:pipeline_run_stage) { build_stubbed(:pipeline_run_stage, job_status: PipelineRunStage::STATUS_FAILED, pipeline_run: pipeline_run) }
      before { allow(pipeline_run).to receive(:active_stage).and_return(pipeline_run_stage) }
      before { allow(pipeline_run).to receive(:report_failed_pipeline_run_stage) }
      before { allow(pipeline_run).to receive(:enqueue_new_pipeline_run) }

      shared_examples "failing sample" do |reports_error:, mutates_model_attributes: {}, enqueues_new_pipeline_run:|
        it "changes status to failed" do
          pipeline_run.update_job_status

          expect(pipeline_run).to have_attributes(finalized: 1,
                                                  job_status: "1.Host Filtering-FAILED",
                                                  **mutates_model_attributes)
          expect(pipeline_run.time_to_finalized).to be > 0
        end

        if reports_error
          it "logs SampleFailedEvent error" do
            pipeline_run.update_job_status

            expect(pipeline_run).to have_received(:report_failed_pipeline_run_stage).with(instance_of(PipelineRunStage), anything, boolean)
          end
        end

        if enqueues_new_pipeline_run
          it "enqueues new pipeline run" do
            pipeline_run.update_job_status

            expect(pipeline_run).to have_received(:enqueue_new_pipeline_run)
          end
        else
          it "does not enqueue new pipeline run" do
            pipeline_run.update_job_status

            expect(pipeline_run).not_to have_received(:enqueue_new_pipeline_run)
          end
        end
      end

      context "and it is a known user error" do
        before { allow(pipeline_run).to receive(:check_for_user_error).and_return(["FAULTY_INPUT", "Some user error"]) }
        before { allow(pipeline_run).to receive(:automatic_restart_allowed?).and_return(true) }

        include_examples "failing sample", reports_error: false,
                                           enqueues_new_pipeline_run: false,
                                           mutates_model_attributes: { known_user_error: "FAULTY_INPUT", error_message: "Some user error" }
      end

      context "and it is not a known user error" do
        before { allow(pipeline_run).to receive(:check_for_user_error).and_return([nil, nil]) }

        context "and an automatic restart is allowed" do
          before { allow(pipeline_run).to receive(:automatic_restart_allowed?).and_return(true) }

          include_examples "failing sample", reports_error: true, enqueues_new_pipeline_run: true
        end

        context "and an automatic restart is not allowed" do
          before { allow(pipeline_run).to receive(:automatic_restart_allowed?).and_return(false) }

          include_examples "failing sample", reports_error: true, enqueues_new_pipeline_run: false
        end
      end
    end
  end

  context "#automatic_restart_allowed?" do
    let(:user) { build_stubbed(:admin) }
    let(:sample) { build_stubbed(:sample, user: user) }
    let(:list_of_previous_pipeline_runs_same_version) { [] }
    let(:previous_pipeline_runs_same_version_relation) { instance_double("PipelineRun::ActiveRecord_Relation", to_a: list_of_previous_pipeline_runs_same_version) }
    let(:pipeline_run_stages) do
      [
        # TODO: (gdingle): rename to stage_number. See https://jira.czi.team/browse/IDSEQ-1912.
        build_stubbed(:pipeline_run_stage, step_number: 1, job_status: PipelineRunStage::STATUS_SUCCEEDED),
        build_stubbed(:pipeline_run_stage, step_number: 2, job_status: PipelineRunStage::STATUS_SUCCEEDED),
        build_stubbed(:pipeline_run_stage, step_number: 3, job_status: PipelineRunStage::STATUS_FAILED),
        build_stubbed(:pipeline_run_stage, step_number: 4, job_status: nil),
      ]
    end
    before { allow(pipeline_run).to receive(:active_stage).and_return(pipeline_run_stages[2]) }
    before { allow(pipeline_run).to receive(:previous_pipeline_runs_same_version).and_return(previous_pipeline_runs_same_version_relation) }

    subject { pipeline_run.automatic_restart_allowed? }

    context "when branch is not master" do
      let(:pipeline_run) { build_stubbed(:pipeline_run, pipeline_version: "3.7", sample: sample, pipeline_run_stages: pipeline_run_stages, pipeline_branch: "anything_other_than_master") }
      it { is_expected.to be_falsy }
    end

    context "when branch is master" do
      let(:pipeline_run) { build_stubbed(:pipeline_run, pipeline_version: "3.7", sample: sample, pipeline_run_stages: pipeline_run_stages) }

      context "and stage is not allowed to restart in AppConfig::AUTO_RESTART_ALLOWED_STAGES configuration" do
        before { AppConfigHelper.set_app_config(AppConfig::AUTO_RESTART_ALLOWED_STAGES, "[1,2,4]") }
        it { is_expected.to be_falsy }
      end

      context "and AppConfig::AUTO_RESTART_ALLOWED_STAGES configuration is invalid" do
        before { AppConfigHelper.set_app_config(AppConfig::AUTO_RESTART_ALLOWED_STAGES, "invalid_json_value") }
        it { is_expected.to be_falsy }
      end

      context "and stage is authorized to restart in AppConfig::AUTO_RESTART_ALLOWED_STAGES configuration" do
        before { AppConfigHelper.set_app_config(AppConfig::AUTO_RESTART_ALLOWED_STAGES, "[1,2,3,4]") }

        context "and sample has no previous pipeline runs with the same pipeline version" do
          it { is_expected.to be_truthy }
        end

        context "and sample has previous pipeline runs with the same pipeline version" do
          context "and they all succeeded" do
            let(:list_of_previous_pipeline_runs_same_version) { [build_stubbed(:pipeline_run)] }

            it { is_expected.to be_truthy }
          end

          context "and at least one of them failed" do
            let(:list_of_previous_pipeline_runs_same_version) { [build_stubbed(:pipeline_run, job_status: "FAILED")] }

            it { is_expected.to be_falsy }
          end
        end
      end
    end
  end

  context "#report_failed_pipeline_run_stage" do
    let(:user) { build_stubbed(:admin) }
    let(:sample) { build_stubbed(:sample, user: user, id: 123) }
    let(:pipeline_run) { build_stubbed(:pipeline_run, sample: sample) }
    let(:pipeline_run_stage) { build_stubbed(:pipeline_run_stage, pipeline_run: pipeline_run) }

    before { allow(Rails.logger).to receive(:error) }

    it "logs errors" do
      pipeline_run.send(:report_failed_pipeline_run_stage, pipeline_run_stage, nil, false)

      expect(Rails.logger).to have_received(:error).with(match(/SampleFailedEvent:/))
    end
  end

  context "host_subtracted" do
    def dag_json(host)
      {
        # copied from actual stage
        "steps": [
          {
            "class": "PipelineStepRunStar",
            "additional_files": {
              "star_genome": "s3://fake-references/host_filter/#{host}/2017-09-01-utc-1504224000-unixtime__2017-09-01-utc-1504224000-unixtime/STAR_genome.tar",
            },
          },
        ],
      }.to_json
    end

    let(:host_genome_name) { "none" }

    before do
      star_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/test_host/2020-09-22/test_host_STAR_genome.tar"
      bowtie2_index_path = "s3://#{S3_DATABASE_BUCKET}/host_filter/test_host/2020-09-22/test_host_bowtie2_genome.tar"
      @test_host = create(:host_genome, name: "test_host", s3_star_index_path: star_index_path, s3_bowtie2_index_path: bowtie2_index_path)

      user = create(:admin)
      project = create(:project)
      @sample_one = create(:sample, project: project, user: user, host_genome_name: host_genome_name)
      @sample_two = create(:sample, project: project, user: user, host_genome_name: host_genome_name)
      create(:pipeline_run, sample: @sample_one, pipeline_execution_strategy: PipelineRun.pipeline_execution_strategies[:directed_acyclic_graph])
      create(:pipeline_run, sample: @sample_two, sfn_execution_arn: fake_sfn_execution_arn)
    end

    context "host filter genome available" do
      let(:host_genome_name) { @test_host.name }

      it "should show the host that was subtracted for dag runs" do
        expect(@sample_one.first_pipeline_run.host_subtracted).to eq("test_host")
      end
      it "should show the host that was subtracted for sfn runs" do
        expect(@sample_two.first_pipeline_run.host_subtracted).to eq("test_host")
      end
    end

    context "ercc only" do
      let(:host_genome_name) { "ercc" }

      it "should show ercc only subtracted for dag runs" do
        expect(@sample_one.first_pipeline_run.host_subtracted).to eq("ERCC Only")
      end
      it "should show ercc only subtracted for sfn runs" do
        expect(@sample_two.first_pipeline_run.host_subtracted).to eq("ERCC Only")
      end
    end
  end

  context "#async_update_job_status" do
    NO_USER_ERROR = [false, nil].freeze
    USER_ERROR = [true, "Insufficient reads"].freeze

    let(:pipeline_run_id) { 12_345 }
    let(:stage_number) { 1 }

    let(:project) { create(:project) }
    let(:sample) { create(:sample, project_id: project.id) }
    let(:pipeline_execution_strategy) { "step_function" }

    let(:check_for_user_error_response) { NO_USER_ERROR }
    let(:report_ready_response) { false }

    let(:pipeline_run_stages_statuses) { [nil, nil, nil, nil] }

    subject do
      pipeline_run = create(:pipeline_run,
                            id: pipeline_run_id,
                            sample_id: sample.id,
                            pipeline_execution_strategy: pipeline_execution_strategy,
                            executed_at: 1.minute.ago)
      pipeline_run.pipeline_run_stages.order(step_number: :asc).zip(pipeline_run_stages_statuses).each do |prs, st|
        prs.update!(job_status: st) unless st.nil?
      end
      pipeline_run.async_update_job_status
      pipeline_run
    end

    before do
      allow(subject).to receive(:check_for_user_error).and_return(check_for_user_error_response)
      allow(subject).to receive(:report_ready?).and_return(report_ready_response)
    end

    context "when received a single stage update" do
      context "in order" do
        context "and stage 1 reported success" do
          let(:pipeline_run_stages_statuses) { ["SUCCEEDED", nil, nil, nil] }
          it { is_expected.to have_attributes(job_status: "2.Minimap2/Diamond alignment-STARTED", finalized: 0) }
        end
        context "and stage 1 reported failure" do
          let(:pipeline_run_stages_statuses) { ["FAILED", nil, nil, nil] }
          it { is_expected.to have_attributes(job_status: "1.Host Filtering-FAILED", finalized: 1) }
        end
      end
      context "out of order" do
        context "and only stage 3 reported success" do
          let(:pipeline_run_stages_statuses) { [nil, nil, "SUCCEEDED", nil] }
          it { is_expected.to have_attributes(job_status: "1.Host Filtering-STARTED", finalized: 0) }
        end
        context "only stage 3 reported failure" do
          let(:pipeline_run_stages_statuses) { [nil, nil, "FAILED", nil] }
          it { is_expected.to have_attributes(job_status: "1.Host Filtering-STARTED", finalized: 0) }
        end
      end
    end

    context "when received multiple stage updates in any order" do
      context "and stages 1/2/3 reported success" do
        let(:pipeline_run_stages_statuses) { ["SUCCEEDED", "SUCCEEDED", "SUCCEEDED", nil] }
        it { is_expected.to have_attributes(job_status: "4.Experimental-STARTED", finalized: 0) }
      end
      context "and stages 1/3/4 reported successes but missing staging 2 status" do
        let(:pipeline_run_stages_statuses) { ["SUCCEEDED", nil, "SUCCEEDED", "SUCCEEDED"] }
        it { is_expected.to have_attributes(job_status: "2.Minimap2/Diamond alignment-STARTED", finalized: 0) }
      end
      context "and all stages reported success" do
        let(:pipeline_run_stages_statuses) { ["SUCCEEDED", "SUCCEEDED", "SUCCEEDED", "SUCCEEDED"] }
        it {
          is_expected.to have_attributes(job_status: "CHECKED", finalized: 1)
          expect(subject.time_to_finalized).to be > 0
        }
      end
      context "and stages 1/2 reported success and stage 3 reported failure" do
        let(:pipeline_run_stages_statuses) { ["SUCCEEDED", "SUCCEEDED", "FAILED", nil] }
        it { is_expected.to have_attributes(job_status: "3.Post Processing-FAILED", finalized: 1) }
      end
      context "and stage 3 reported failure, stage 1 reported success, but missing stage 2 status" do
        let(:pipeline_run_stages_statuses) { ["SUCCEEDED", nil, "FAILED", nil] }
        it { is_expected.to have_attributes(job_status: "2.Minimap2/Diamond alignment-STARTED", finalized: 0) }
      end
    end
  end

  describe "#sfn_results_path" do
    let(:project) { create(:project) }
    let(:sample) do
      create(:sample, project: project)
    end
    let(:pipeline_run) do
      create(:pipeline_run,
             sample: sample,
             s3_output_prefix: "fake-prefix",
             sfn_execution_arn: "fake-arn",
             wdl_version: "5.0")
    end
    let(:pipeline_run_no_prefix) do
      create(:pipeline_run,
             sample: sample,
             sfn_execution_arn: "fake-arn",
             wdl_version: "5.0",
             pipeline_version: "5.0")
    end

    context "when s3_output_prefix is provided" do
      it "references the provided path" do
        expected = File.join(pipeline_run.s3_output_prefix, pipeline_run.version_key_subpath)
        expect(pipeline_run.sfn_results_path).to eq(expected)
      end
    end

    context "when s3_output_prefix is absent" do
      it "falls back to the previous sample-level path convention" do
        expected = File.join(sample.sample_output_s3_path, pipeline_run.version_key_subpath)
        expect(pipeline_run_no_prefix.sfn_results_path).to eq(expected)
      end
    end
  end

  context "write contig mapping table" do
    let(:contig_mock) do
      {
        "NODE_1_length_100_cov_0.123" =>
        ["NODE_1_length_100_cov_0.123", "CP000253.1", "97.794", "136", "3", "0", "1", "136", "213526", "213391", "1.13e-59", "235.0", "136", "2821361"],
      }
    end

    before do
      project = create(:project, users: [@joe], name: "Test Project")
      @sample_one = create(:sample, project: project, user: @joe)
      @sample_two = create(:sample, project: project, user: @joe)
      @pipeline_run_one = create(:pipeline_run, sample: @sample_one)
      @pipeline_run_two = create(:pipeline_run, sample: @sample_two, technology: PipelineRun::TECHNOLOGY_INPUT[:nanopore])
    end

    context "when pipeline run is illumina and there are no contigs" do
      it "doesn't write anything" do
        pipeline_run = @sample_one.pipeline_runs.first
        csv = []
        pipeline_run.write_contig_mapping_table_csv(csv)
        expect(csv.size).to eq(0)
      end
    end

    context "when pipeline run is illumina and there are contigs" do
      it "writes two rows" do
        pipeline_run = @sample_one.pipeline_runs.first
        create(:contig, name: "NODE_1_length_100_cov_0.123", pipeline_run_id: pipeline_run.id)
        allow_any_instance_of(PipelineRun).to receive(:get_m8_mapping).and_return(contig_mock)
        csv = []
        pipeline_run.write_contig_mapping_table_csv(csv)
        expect(csv.size).to eq(2) # 1 header row 1 contig
        expect(csv[0][0]).to eq("contig_name")
        expect(csv[1][0]).to eq("NODE_1_length_100_cov_0.123")
      end
    end

    context "when pipeline run is ONT and there are contigs" do
      it "writes two rows with base count column" do
        pipeline_run = @sample_two.pipeline_runs.first
        create(:contig, base_count: 42, name: "NODE_1_length_100_cov_0.123", pipeline_run_id: pipeline_run.id)
        allow_any_instance_of(PipelineRun).to receive(:get_m8_mapping).and_return(contig_mock)
        csv = []
        pipeline_run.write_contig_mapping_table_csv(csv)
        expect(csv.size).to eq(2) # 1 header row 1 contig
        expect(csv[0][2]).to eq("base_count")
        expect(csv[1][2]).to eq(42)
      end
    end
  end

  context "loading qc_percent and compression_ratio from job_stats" do
    let(:job_stats) do
      [
        ["cdhitdup_out", 5000],
        ["priceseq_out", 1_000_000],
        ["star_out", 2_000_000],
      ]
    end

    let(:zero_job_stats) do
      [
        ["cdhitdup_out", 0.0],
        ["priceseq_out", 0.0],
        ["star_out", 0.0],
      ]
    end

    before do
      @pipeline_run_one = create(:pipeline_run)
      job_stats.each do |step, reads_after|
        create(:job_stat, task: step, reads_after: reads_after, pipeline_run_id: @pipeline_run_one.id)
      end

      @pipeline_run_two = create(:pipeline_run)
      zero_job_stats.each do |step, reads_after|
        create(:job_stat, task: step, reads_after: reads_after, pipeline_run_id: @pipeline_run_two.id)
      end
    end

    context "when the job stats are present and non-zero" do
      it "updates qc_percent and compression_ratio" do
        job_stats_hash = @pipeline_run_one.job_stats.index_by(&:task)

        @pipeline_run_one.load_compression_ratio(job_stats_hash)
        @pipeline_run_one.load_qc_percent(job_stats_hash)

        expect(@pipeline_run_one.compression_ratio).to eq(200.0)
        expect(@pipeline_run_one.qc_percent).to eq(50.0)
      end
    end

    context "when czid_dedup_stats reads_remaining is 0" do
      it "does not error while trying to update compression_ratio" do
        job_stats_hash = @pipeline_run_two.job_stats.index_by(&:task)

        @pipeline_run_two.load_compression_ratio(job_stats_hash)
        expect(@pipeline_run_two.compression_ratio).to eq(nil)
      end
    end

    context "when star_stats reads_remaining is 0" do
      it "does not error while trying to update qc_percent" do
        job_stats_hash = @pipeline_run_two.job_stats.index_by(&:task)

        @pipeline_run_two.load_qc_percent(job_stats_hash)
        expect(@pipeline_run_two.qc_percent).to eq(nil)
      end
    end
  end

  describe "#update_single_stage_run_status" do
    before do
      project = create(:project)
      sample = create(:sample, project: project)
      @pipeline_running = create(:pipeline_run, job_status: WorkflowRun::STATUS[:running], sample: sample, sfn_execution_arn: fake_sfn_execution_arn, executed_at: 1.minute.ago)
    end

    context "when remote status is 'FAILED'" do
      let(:failed_sfn_status) { WorkflowRun::STATUS[:failed] }

      it "sets job status to 'FAILED'" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_error_sfn_execution_description)
        @mock_aws_clients[:states].stub_responses(:get_execution_history, fake_error_sfn_execution_history)
        @pipeline_running.update_single_stage_run_status
        expect(@pipeline_running.job_status).to eq(WorkflowRun::STATUS[:failed])
        expect(@pipeline_running.finalized).to eq(1)
      end
    end

    context "when remote status is 'TIMED_OUT'" do
      let(:failed_sfn_status) { WorkflowRun::STATUS[:timed_out] }

      it "sets job status to 'FAILED'" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_error_sfn_execution_description)
        @pipeline_running.update_single_stage_run_status
        expect(@pipeline_running.job_status).to eq(WorkflowRun::STATUS[:failed])
        expect(@pipeline_running.finalized).to eq(1)
      end
    end

    context "when remote status is 'ABORTED'" do
      let(:failed_sfn_status) { WorkflowRun::STATUS[:aborted] }

      it "sets job status to 'FAILED'" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_error_sfn_execution_description)
        @pipeline_running.update_single_stage_run_status
        expect(@pipeline_running.job_status).to eq(WorkflowRun::STATUS[:failed])
        expect(@pipeline_running.finalized).to eq(1)
      end
    end

    it "reports run failures" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_error_sfn_execution_description)
      @mock_aws_clients[:states].stub_responses(:get_execution_history, fake_error_sfn_execution_history)
      expect(Rails.logger).to receive(:error).with(match(/SampleFailedEvent/))

      @pipeline_running.update_single_stage_run_status
      expect(@pipeline_running.job_status).to eq(WorkflowRun::STATUS[:failed])
    end

    context "when remote status is 'SUCCEEDED'" do
      let(:fake_sfn_status) { WorkflowRun::STATUS[:succeeded] }

      it "sets job status to 'CHECKED'" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_sfn_execution_description)
        @pipeline_running.update_single_stage_run_status
        expect(@pipeline_running.job_status).to eq(PipelineRun::STATUS_CHECKED)
        expect(@pipeline_running.finalized).to eq(1)
      end
    end

    context "when pipeline run is finalized and notification is processed out of order" do
      let(:fake_sfn_status) { WorkflowRun::STATUS[:running] }

      before do
        allow(S3Util).to receive(:get_s3_file)
          .and_return(fake_sfn_execution_description.to_json)
      end

      it "does not revert job status to 'RUNNING'" do
        @pipeline_running.update(finalized: 1)
        @pipeline_running.update(job_status: PipelineRun::STATUS_CHECKED)

        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_sfn_execution_description)
        @pipeline_running.update_single_stage_run_status
        expect(@pipeline_running.job_status).to eq(PipelineRun::STATUS_CHECKED)
      end
    end
  end

  describe "#get_lineage_json" do
    before do
      project = create(:project)
      sample1 = create(:sample, project: project,
                                user: @joe,
                                name: "sample")
      @alignment_config = create(:alignment_config, lineage_version: "2022-01-02")
      @pr = create(:pipeline_run, sample: sample1, alignment_config: @alignment_config)
    end

    it "logs an error if no lineage is found for the taxid" do
      taxid = 38_289
      taxon_lineage_map = {
        1 => "this is a stringified taxon lineage entry",
      }
      c2taxid = { "NT" => taxid.to_s }
      expect(LogUtil).to receive(:log_error).with(
        "No lineage found for taxid #{taxid} when loading contigs.",
        exception: TaxonLineage::LineageNotFoundError.new(taxid),
        lineage_version: @alignment_config.lineage_version
      )
      @pr.get_lineage_json(c2taxid, taxon_lineage_map)
    end
  end

  describe '#db_load_contigs' do
    before do
      project = create(:project)
      sample1 = create(:sample, project: project,
                                user: @joe,
                                name: "sample")
      @lineage = create(:taxon_lineage, taxid: 38_289, superkingdom_taxid: 2, kingdom_taxid: -650, phylum_taxid: 201_174, class_taxid: 1760, order_taxid: 85_007, family_taxid: 1653, genus_taxid: 1716, species_taxid: 38_289, version_start: "2022-01-02", version_end: "2022-01-02")
      @alignment_config = create(:alignment_config, lineage_version: "2022-01-02")
      @pr = create(:pipeline_run, sample: sample1, alignment_config: @alignment_config)

      # stub file downloads and I/O and load contigs
      allow(PipelineRun).to receive(:download_file_with_retries).with(@pr.s3_file_for("contigs"), PipelineRun::LOCAL_JSON_PATH, 3).and_return("/tmp/results_json/contig_stats.json")
      allow(File).to receive(:read).with("/tmp/results_json/contig_stats.json").and_return(JSON.generate(CONTIG_STATS))
      allow(PipelineRun).to receive(:download_file_with_retries).with("#{@pr.assembly_s3_path}/#{PipelineRun::ASSEMBLED_CONTIGS_NAME}", PipelineRun::LOCAL_JSON_PATH, 3).and_return("/tmp/results_json/contigs.fasta")
      allow(File).to receive(:open).with("/tmp/results_json/contigs.fasta", "r").and_yield(StringIO.new(CONTIGS))
      @pr.db_load_contigs(CONTIG2TAXID)
    end

    it "correctly loads lineage information into contigs" do
      contig1 = @pr.contigs.first
      expect(contig1.species_taxid_nt).to eq(@lineage.species_taxid)
      expect(contig1.genus_taxid_nt).to eq(@lineage.genus_taxid)
      expect(JSON.parse(contig1.lineage_json)["NT"]).to eq(@lineage.to_a)
    end

    it "correctly loads contigs for taxa missing a lineage" do
      expect(@pr.contigs.count).to eq(2)
      expect(@pr.contigs[1].species_taxid_nt).to be_nil
      expect(JSON.parse(@pr.contigs[1].lineage_json)["NT"]).to be_nil
    end
  end

  describe '#db_load_byteranges' do
    let(:project) { create(:project) }
    let(:sample) { create(:sample, project: project, name: "test_sample") }
    let(:pipeline_run) { create(:pipeline_run, sample: sample) }
    let(:fake_s3_path) { "s3://fake-bucket/fake-path/taxon_byteranges.json" }
    let(:fake_local_json_path) { "/tmp/pipeline_run_#{pipeline_run.id}" }
    let(:fake_downloaded_path) { "#{fake_local_json_path}/taxon_byteranges.json" }
    let(:fake_json_data) do
      [
        { 'taxid' => 1234, 'hit_type' => 'NT', 'first_byte' => 0, 'last_byte' => 500 },
        { 'taxid' => 5678, 'hit_type' => 'NR', 'first_byte' => 501, 'last_byte' => 1000 },
        { 'taxid' => 9999, 'hit_type' => 'NT', 'first_byte' => 1001, 'last_byte' => 1500 },
      ]
    end

    before do
      # Stub S3 file path generation
      allow(pipeline_run).to receive(:s3_file_for).with("taxon_byteranges").and_return(fake_s3_path)
      # Stub local path generation
      allow(pipeline_run).to receive(:local_json_path).and_return(fake_local_json_path)
      # Stub file download
      allow(PipelineRun).to receive(:download_file).with(fake_s3_path, fake_local_json_path).and_return(fake_downloaded_path)
      # Stub JSON file reading
      allow(File).to receive(:open).with(fake_downloaded_path).and_return(StringIO.new(fake_json_data.to_json))
      # Stub file cleanup
      allow(Syscall).to receive(:run).with("rm", "-f", fake_downloaded_path)
    end

    context "when successful" do
      it "imports taxon byteranges correctly" do
        expect { pipeline_run.db_load_byteranges }.to(change { TaxonByterange.count }.by(3))
        # Verify the data was imported correctly
        byterange1 = TaxonByterange.find_by(pipeline_run: pipeline_run, taxid: 1234, hit_type: "NT")
        expect(byterange1.first_byte).to eq(0)
        expect(byterange1.last_byte).to eq(500)
        byterange2 = TaxonByterange.find_by(pipeline_run: pipeline_run, taxid: 5678, hit_type: "NR")
        expect(byterange2.first_byte).to eq(501)
        expect(byterange2.last_byte).to eq(1000)
        byterange3 = TaxonByterange.find_by(pipeline_run: pipeline_run, taxid: 9999, hit_type: "NT")
        expect(byterange3.first_byte).to eq(1001)
        expect(byterange3.last_byte).to eq(1500)
      end
      it "sets correct timestamps automatically" do
        pipeline_run.db_load_byteranges
        byterange = TaxonByterange.find_by(pipeline_run: pipeline_run, taxid: 1234)
        expect(byterange.created_at).to be_present
        expect(byterange.updated_at).to be_present
      end
      it "logs successful import" do
        expect(Rails.logger).to receive(:info).with("Successfully imported 3 taxon byteranges for pipeline run #{pipeline_run.id}")
        pipeline_run.db_load_byteranges
      end
      it "cleans up temporary files" do
        expect(Syscall).to receive(:run).with("rm", "-f", fake_downloaded_path)
        pipeline_run.db_load_byteranges
      end
    end

    context "when dealing with duplicates" do
      it "updates existing records with on_duplicate_key_update" do
        # Create existing record
        existing = create(:taxon_byterange,
                          pipeline_run: pipeline_run,
                          taxid: 1234,
                          hit_type: "NT",
                          first_byte: 999,
                          last_byte: 1999)
        # Mock JSON to only return the duplicate record with new values
        allow(File).to receive(:open).with(fake_downloaded_path).and_return(StringIO.new([{ 'taxid' => 1234, 'hit_type' => 'NT', 'first_byte' => 0, 'last_byte' => 500 }].to_json))
        expect { pipeline_run.db_load_byteranges }.not_to(change { TaxonByterange.count })
        # Verify the existing record was updated
        existing.reload
        expect(existing.first_byte).to eq(0)
        expect(existing.last_byte).to eq(500)
      end
    end

    context "when JSON parsing fails" do
      before do
        allow(File).to receive(:open).with(fake_downloaded_path).and_raise(StandardError.new("JSON parsing failed"))
      end
      it "logs error and handles exception" do
        expect(LogUtil).to receive(:log_error).with(
          "PipelineRun #{pipeline_run.id} failed db_load_byteranges import: JSON parsing failed",
          pipeline_run_id: pipeline_run.id,
          exception: instance_of(StandardError)
        )
        expect { pipeline_run.db_load_byteranges }.not_to raise_error
      end
      it "still cleans up files in ensure block" do
        expect(Syscall).to receive(:run).with("rm", "-f", fake_downloaded_path)
        pipeline_run.db_load_byteranges
      end
    end

    context "when activerecord-import fails" do
      before do
        # Mock a failed import result
        failed_result = double("import_result", failed_instances: [double("failed_instance")])
        allow(TaxonByterange).to receive(:import).and_return(failed_result)
      end
      it "logs error when some records fail to import" do
        expect(LogUtil).to receive(:log_error).with(
          "PipelineRun #{pipeline_run.id} failed db_load_byteranges import: 1 failures",
          pipeline_run_id: pipeline_run.id
        )
        pipeline_run.db_load_byteranges
      end
    end

    context "when file download fails" do
      before do
        allow(PipelineRun).to receive(:download_file).and_raise(StandardError.new("S3 download failed"))
      end
      it "logs error and handles exception" do
        expect(LogUtil).to receive(:log_error).with(
          "PipelineRun #{pipeline_run.id} failed db_load_byteranges import: S3 download failed",
          pipeline_run_id: pipeline_run.id,
          exception: instance_of(StandardError)
        )

        expect { pipeline_run.db_load_byteranges }.not_to raise_error
      end
    end
  end
end
