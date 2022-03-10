require "rails_helper"

GOOD_GENE = "Tet-40_Tet".freeze
GOOD_ALLELE = "Tet-40_1546".freeze
GOOD_COVERAGE = "100.0".freeze
GOOD_DEPTH = "15.478".freeze
GOOD_ANNOTATION = "no;no;Tet-40;Tet;AM419751;14211-15431;1221".freeze
GOOD_DRUG_FAMILY = "Tet".freeze
GOOD_TOTAL_READS = "196".freeze
GOOD_RPM = "19.6".freeze
GOOD_DPM = "1.5478".freeze

GOOD_ANNOTATION_GENE = "Tet-40".freeze
GOOD_GENBANK_ACCESSION = "AM419751".freeze

GOOD_AMR_RESULTS = [
  ["Sample", "DB", "gene", "allele", "coverage", "depth", "diffs", "uncertainty", "divergence", "length", "maxMAF", "clusterid", "seqid", "annotation", "gene_family", "total_gene_hits", "total_coverage", "total_depth", "total_reads", "rpm", "dpm"],
  ["", "ARGannot_r2", GOOD_GENE, GOOD_ALLELE, GOOD_COVERAGE, GOOD_DEPTH, "4snp", "", "0.32799999999999996", "1221", "0.5", "63", "1546", GOOD_ANNOTATION, GOOD_DRUG_FAMILY, "9", "653.292", "151.204", GOOD_TOTAL_READS, GOOD_RPM, GOOD_DPM],
].freeze

GOOD_AMR_COUNTS = [
  {
    "gene" => GOOD_GENE,
    "allele" => GOOD_ALLELE,
    "coverage" => GOOD_COVERAGE.to_f,
    "depth" => GOOD_DEPTH.to_f,
    "drug_family" => GOOD_DRUG_FAMILY,
    "total_reads" => GOOD_TOTAL_READS.to_i,
    "rpm" => GOOD_RPM.to_f,
    "dpm" => GOOD_DPM.to_f,
    "annotation_gene" => GOOD_ANNOTATION_GENE,
    "genbank_accession" => GOOD_GENBANK_ACCESSION,
  },
].freeze

MALFORMED_ANNOTATION = "no;no;".freeze
MALFORMED_AMR_RESULTS = [
  ["Sample", "DB", "gene", "allele", "coverage", "depth", "diffs", "uncertainty", "divergence", "length", "maxMAF", "clusterid", "seqid", "annotation", "gene_family", "total_gene_hits", "total_coverage", "total_depth", "total_reads", "rpm", "dpm"],
  ["", "ARGannot_r2", GOOD_GENE, GOOD_ALLELE, "", GOOD_DEPTH, "4snp", "", "0.32799999999999996", "1221", "0.5", "63", "1546", MALFORMED_ANNOTATION, GOOD_DRUG_FAMILY, "9", "653.292", "151.204", GOOD_TOTAL_READS, "", GOOD_DPM],
].freeze # test missing and malformed results

MALFORMED_AMR_COUNTS = [
  {
    "gene" => GOOD_GENE,
    "allele" => GOOD_ALLELE,
    "coverage" => nil,
    "depth" => GOOD_DEPTH.to_f,
    "drug_family" => GOOD_DRUG_FAMILY,
    "total_reads" => GOOD_TOTAL_READS.to_i,
    "rpm" => nil,
    "dpm" => GOOD_DPM.to_f,
    "annotation_gene" => nil,
    "genbank_accession" => nil,
  },
].freeze # properly handled amr count for problematic results

describe PipelineRun, type: :model do
  let(:fake_output_prefix) { "s3://fake-output-prefix" }
  let(:fake_sfn_name) { "fake_sfn_name" }
  let(:fake_sfn_arn) { "fake:sfn:arn".freeze }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn:#{fake_sfn_name}".freeze }
  let(:fake_error) { "fake_error" }
  let(:fake_sfn_execution_description) do
    {
      execution_arn: fake_sfn_arn,
      input: JSON.dump(OutputPrefix: fake_output_prefix),
      # AWS SDK rounds to second
      start_date: Time.zone.now.round,
      state_machine_arn: fake_sfn_execution_arn,
      status: "SUCCESS",
    }
  end
  let(:fake_error_sfn_execution_description) do
    {
      execution_arn: fake_sfn_arn,
      input: JSON.dump(OutputPrefix: fake_output_prefix),
      start_date: Time.zone.now.round,
      state_machine_arn: fake_sfn_execution_arn,
      status: "FAILED",
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

  context "#db_load_amr_counts" do
    let(:user) { build_stubbed(:user) }
    let(:sample) { build_stubbed(:sample, user: user) }
    let(:pipeline_run) do
      build_stubbed(
        :pipeline_run,
        sample: sample,
        pipeline_version: "3.9",
        sfn_execution_arn: fake_sfn_execution_arn
      )
    end
    let(:results_path) { "amr_processed_results.csv" }

    before do
      Aws.config[:states] = {
        stub_responses: {
          describe_execution: fake_sfn_execution_description,
          list_tags_for_resource: {
            tags: [
              { key: "wdl_version", value: fake_wdl_version },
              { key: "dag_version", value: fake_dag_version },
            ],
          },
        },
      }
    end

    context "No AMR counts file exists on S3 (PipelineRun.download_file() returned nil)" do
      before do
        # Test case nil
        allow(PipelineRun).to receive(:download_file).and_return(nil)
        allow(Rails.logger).to receive(:error)
      end

      it "should log an error and simply return" do
        pipeline_run.db_load_amr_counts()

        expect(Rails.logger).to have_received(:error).with(match(/No AMR results file found for PipelineRun #/))
        expect(pipeline_run.amr_counts).to eq([])
      end
    end

    context "AMR counts file exists, but is empty (results found no amr counts)" do
      before do
        pseudofile = StringIO.new("\n")
        allow(PipelineRun).to receive(:download_file).and_return(results_path)
        allow(File).to receive(:size?).and_return(1)
        allow(CSV).to receive(:read).and_return(CSV.new(pseudofile.read, headers: true))
        allow(pipeline_run).to receive(:update).and_return(true)
      end

      it "should update amr counts as an empty array" do
        pipeline_run.db_load_amr_counts()

        expect(Rails.logger).to receive(:error).exactly(0).times
        expect(pipeline_run.amr_counts).to eq([])
      end
    end

    context "AMR counts file exists, but lines are malformed" do
      before do
        csv_write_string = CSVSafe.generate do |csv|
          MALFORMED_AMR_RESULTS.each do |line|
            csv << line
          end
        end
        pseudofile = StringIO.new(csv_write_string)
        allow(PipelineRun).to receive(:download_file).and_return(results_path)
        allow(File).to receive(:size?).and_return(80)
        allow(CSV).to receive(:read).and_return(CSV.new(pseudofile.read, headers: true))
        allow(pipeline_run).to receive(:update) do |update|
          amr_counts = []
          ActiveRecord::Base.connection.execute("SET foreign_key_checks = 0;")
          update[:amr_counts_attributes].each do |count|
            new_count = create(:amr_count, pipeline_run: pipeline_run, gene: count[:gene], allele: count[:allele], coverage: count[:coverage], depth: count[:depth], drug_family: count[:drug_family], rpm: count[:rpm], dpm: count[:dpm], total_reads: count[:total_reads])
            amr_counts.push(new_count)
          end
          ActiveRecord::Base.connection.execute("SET foreign_key_checks = 1;")
          pipeline_run.amr_counts = amr_counts
        end
      end

      it "should properly handle a malformed csv file" do
        pipeline_run.db_load_amr_counts()

        expect(Rails.logger).to receive(:error).exactly(0).times
        expect(JSON.parse(pipeline_run.amr_counts[0].to_json)).to include(MALFORMED_AMR_COUNTS[0])
      end
    end

    context "Properly handle a good AMR result" do
      before do
        pipeline_run.amr_counts = []
        csv_write_string = CSVSafe.generate do |csv|
          GOOD_AMR_RESULTS.each do |line|
            csv << line
          end
        end
        pseudofile = StringIO.new(csv_write_string)
        allow(PipelineRun).to receive(:download_file).and_return(results_path)
        allow(File).to receive(:size?).and_return(80)
        allow(CSV).to receive(:read).and_return(CSV.new(pseudofile.read, headers: true))
        allow(pipeline_run).to receive(:update) do |update|
          amr_counts = []
          ActiveRecord::Base.connection.execute("SET foreign_key_checks = 0;")
          update[:amr_counts_attributes].each do |count|
            new_count = create(:amr_count, pipeline_run: pipeline_run, annotation_gene: count[:annotation_gene], genbank_accession: count[:genbank_accession], gene: count[:gene], allele: count[:allele], coverage: count[:coverage], depth: count[:depth], drug_family: count[:drug_family], rpm: count[:rpm], dpm: count[:dpm], total_reads: count[:total_reads])
            amr_counts.push(new_count)
          end
          ActiveRecord::Base.connection.execute("SET foreign_key_checks = 1;")
          pipeline_run.amr_counts = amr_counts
        end
      end

      it "should properly handle a good csv file" do
        pipeline_run.db_load_amr_counts()

        expect(Rails.logger).to receive(:error).exactly(0).times
        expect(JSON.parse(pipeline_run.amr_counts[0].to_json)).to include(GOOD_AMR_COUNTS[0])
      end
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
end
