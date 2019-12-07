require 'rails_helper'

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

RSpec.describe PipelineRun, type: :model do
  context "#update_job_status" do
    let(:user) { build_stubbed(:user) }
    let(:sample) { build_stubbed(:sample, user: user) }
    let(:pipeline_run) { build_stubbed(:pipeline_run, sample: sample, pipeline_version: "3.7") }
    before { expect(pipeline_run).to receive(:save!) }

    context "when all stages complete successfully" do
      before { allow(pipeline_run).to receive(:active_stage).and_return(nil) }

      it "changes status to finalized" do
        pipeline_run.update_job_status

        expect(pipeline_run).to have_attributes(finalized: 1, job_status: "CHECKED")
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
        end

        if reports_error
          it "sends error to airbrake" do
            pipeline_run.update_job_status

            expect(pipeline_run).to have_received(:report_failed_pipeline_run_stage).with(instance_of(PipelineRunStage), boolean, anything, true)
          end
        else
          it "does not send error to airbrake" do
            pipeline_run.update_job_status

            expect(pipeline_run).to have_received(:report_failed_pipeline_run_stage).with(instance_of(PipelineRunStage), boolean, anything, false)
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
            let(:list_of_previous_pipeline_runs_same_version) { [build_stubbed(:pipeline_run, job_status: 'FAILED')] }

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

    before { allow(LogUtil).to receive(:log_err_and_airbrake) }

    it "sends metric to datadog" do
      allow(MetricUtil).to receive(:put_metric_now)

      pipeline_run.send(:report_failed_pipeline_run_stage, pipeline_run_stage, true, "SOME_USER_ERROR", false)

      expect(MetricUtil).to have_received(:put_metric_now).with("samples.failed", 1, ["sample_id:123", "automatic_restart:true", "known_user_error:true", "send_to_airbrake:false"])
    end

    context "when send_to_airbrake is true" do
      it "sends error to airbrake and log error" do
        pipeline_run.send(:report_failed_pipeline_run_stage, pipeline_run_stage, false, nil, true)

        expect(LogUtil).to have_received(:log_err_and_airbrake).with(match(/SampleFailedEvent:/))
      end
    end

    context "when send_to_airbrake is false" do
      before { allow(Rails.logger).to receive(:warn) }
      it "do not send error to airbrake and log warn" do
        pipeline_run.send(:report_failed_pipeline_run_stage, pipeline_run_stage, true, nil, false)

        expect(LogUtil).to_not have_received(:log_err_and_airbrake)
        expect(Rails.logger).to have_received(:warn).with(match(/SampleFailedEvent:/))
      end
    end
  end

  context "ensure that loading amr counts works properly" do
    let(:user) { build_stubbed(:user) }
    let(:sample) { build_stubbed(:sample, user: user) }
    let(:pipeline_run) { build_stubbed(:pipeline_run, sample: sample, pipeline_version: "3.9") }
    let(:results_path) { "amr_processed_results.csv" }

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
          ActiveRecord::Base.connection.execute('SET foreign_key_checks = 0;')
          update[:amr_counts_attributes].each do |count|
            new_count = create(:amr_count, pipeline_run: pipeline_run, gene: count[:gene], allele: count[:allele], coverage: count[:coverage], depth: count[:depth], drug_family: count[:drug_family], rpm: count[:rpm], dpm: count[:dpm], total_reads: count[:total_reads])
            amr_counts.push(new_count)
          end
          ActiveRecord::Base.connection.execute('SET foreign_key_checks = 1;')
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
          ActiveRecord::Base.connection.execute('SET foreign_key_checks = 0;')
          update[:amr_counts_attributes].each do |count|
            new_count = create(:amr_count, pipeline_run: pipeline_run, annotation_gene: count[:annotation_gene], genbank_accession: count[:genbank_accession], gene: count[:gene], allele: count[:allele], coverage: count[:coverage], depth: count[:depth], drug_family: count[:drug_family], rpm: count[:rpm], dpm: count[:dpm], total_reads: count[:total_reads])
            amr_counts.push(new_count)
          end
          ActiveRecord::Base.connection.execute('SET foreign_key_checks = 1;')
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
end
