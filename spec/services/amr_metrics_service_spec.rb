require "rails_helper"

RSpec.describe AmrMetricsService, type: :service do
  let(:project) { create(:project) }
  let(:sample) { create(:sample, project: project) }
  let(:workflow_run) { create(:workflow_run, sample: sample, workflow: WorkflowRun::WORKFLOW[:amr]) }

  let(:input_read_val) { 40 }
  let(:input_read_count) { { fastqs: input_read_val }.to_json }

  let(:priceseq_out_val) { 2 }
  let(:priceseq_out_count) { { priceseq_out: priceseq_out_val }.to_json }

  let(:star_out_val) { 5 }
  let(:star_out_count) { { star_out: star_out_val }.to_json }

  let(:expected_passed_qc) { (100.0 * priceseq_out_val) / star_out_val }

  let(:gsnap_filter_out_val) { 3 }
  let(:gsnap_filter_out_count) { { gsnap_filter_out: gsnap_filter_out_val }.to_json }

  let(:bowtie2_out_val) { 4 }
  let(:bowtie2_out_count) { { bowtie2_out: bowtie2_out_val }.to_json }

  let(:subsampled_out_val) { 2 }
  let(:subsampled_out_count) { { subsampled_out: subsampled_out_val }.to_json }

  let(:expected_subsampled_fraction) { (1.0 * subsampled_out_val) / bowtie2_out_val }
  let(:expected_remaining_reads) { (gsnap_filter_out_val * (1 / expected_subsampled_fraction)).to_i }

  let(:czid_dedup_out_val) { 6 }
  let(:czid_dedup_out_count) { { czid_dedup_out: czid_dedup_out_val }.to_json }

  let(:expected_compression_ratio) { (1.0 * priceseq_out_val) / czid_dedup_out_val }

  let(:ercc_line_value1) { 2 }
  let(:ercc_line_value2) { 3 }
  let(:ercc_file_lines) do
    "ERCC_line_1\t#{ercc_line_value1}\n" \
    "ERCC_line_2\t#{ercc_line_value2}\n"
  end

  let(:expected_ercc_count) { ercc_line_value1 + ercc_line_value2 }

  let(:raw_insert_size_mean) { 114.174518 }
  let(:raw_insert_size_std_dev) { 21.577178 }
  let(:expected_insert_size_mean) { raw_insert_size_mean.to_i }
  let(:expected_insert_size_std_dev) { raw_insert_size_std_dev.to_f }
  let(:insert_size_metrics_tsv) do
    "# Started on: Thu Jun 30 00:08:32 UTC 2022\n" \
    "## METRICS CLASS\tpicard.analysis.InsertSizeMetrics\n" \
    "MEDIAN_INSERT_SIZE\tMODE_INSERT_SIZE\tMEDIAN_ABSOLUTE_DEVIATION\tMIN_INSERT_SIZE\tMAX_INSERT_SIZE\tMEAN_INSERT_SIZE\tSTANDARD_DEVIATION\n" \
    "115\t129\t16\t18\t594243\t#{raw_insert_size_mean}\t#{raw_insert_size_std_dev}\n"
  end

  let(:expected_percent_remaining) { (100.0 * expected_remaining_reads) / input_read_val }

  subject { AmrMetricsService.new(workflow_run) }

  describe "#call" do
    context "when AMR workflow run was started from a pipeline run" do
      let!(:pipeline_run) do
        create(
          :pipeline_run,
          sample: sample,
          total_reads: input_read_val,
          qc_percent: expected_passed_qc,
          adjusted_remaining_reads: expected_remaining_reads,
          compression_ratio: expected_compression_ratio,
          total_ercc_reads: expected_ercc_count,
          fraction_subsampled: expected_subsampled_fraction
        )
      end

      before do
        allow(workflow_run).to receive(:get_input)
          .with("start_from_mngs").and_return("true")
      end

      context "when insert size metric set exists for pipeline run" do
        before do
          create(:insert_size_metric_set, pipeline_run: pipeline_run, mean: expected_insert_size_mean, standard_deviation: expected_insert_size_std_dev)
        end

        it "returns metrics from pipeline run" do
          metrics = subject.call

          # Some pipeline run columns are stored as float types, and the precision
          # differes from ruby floats.  This is the smallest value for which the specs all pass
          float_margin = 0.0001

          expect(metrics[WorkflowRun::TOTAL_READS_KEY]).to eq(input_read_val)
          expect(metrics[WorkflowRun::QC_PERCENT_KEY]).to be_within(float_margin).of(expected_passed_qc)
          expect(metrics[WorkflowRun::REMAINING_READS_KEY]).to eq(expected_remaining_reads)
          expect(metrics[WorkflowRun::COMPRESSION_RATIO_KEY]).to be_within(float_margin).of(expected_compression_ratio)
          expect(metrics[WorkflowRun::TOTAL_ERCC_READS_KEY]).to eq(expected_ercc_count)
          expect(metrics[WorkflowRun::SUBSAMPLED_FRACTION_KEY]).to be_within(float_margin).of(expected_subsampled_fraction)
          expect(metrics[WorkflowRun::INSERT_SIZE_MEAN_KEY]).to be_within(float_margin).of(expected_insert_size_mean)
          expect(metrics[WorkflowRun::INSERT_SIZE_STD_DEV_KEY]).to be_within(float_margin).of(expected_insert_size_std_dev)
          expect(metrics[WorkflowRun::PERCENT_REMAINING_KEY]).to eq(expected_percent_remaining)
        end
      end

      context "when no insert size metric set exists for pipeline run" do
        it "returns null for insert size metrics" do
          metrics = subject.call

          expect(metrics[WorkflowRun::INSERT_SIZE_MEAN_KEY]).to be_nil
          expect(metrics[WorkflowRun::INSERT_SIZE_STD_DEV_KEY]).to be_nil
        end
      end
    end

    context "when AMR workflow run was not started from a pipeline run" do
      before do
        allow(workflow_run).to receive(:get_input)
          .with("start_from_mngs").and_return("false")

        output_prefix = "#{workflow_run.workflow}.#{AmrMetricsService::HOST_FILTER_STAGE_NAME}."

        output_count_input_read = "#{output_prefix}#{AmrMetricsService::COUNT_INPUT_READ}"
        expect(workflow_run).to receive(:output).with(output_count_input_read)
                                                .and_return(input_read_count)

        output_count_priceseq = "#{output_prefix}#{AmrMetricsService::COUNT_PRICESEQ_OUT}"
        expect(workflow_run).to receive(:output).with(output_count_priceseq)
                                                .and_return(priceseq_out_count)

        output_count_star_out = "#{output_prefix}#{AmrMetricsService::COUNT_STAR_OUT}"
        expect(workflow_run).to receive(:output).with(output_count_star_out)
                                                .and_return(star_out_count)

        output_count_gsnap_filter = "#{output_prefix}#{AmrMetricsService::COUNT_GSNAP_FILTER_OUT}"
        expect(workflow_run).to receive(:output).with(output_count_gsnap_filter)
                                                .and_return(gsnap_filter_out_count)

        output_count_bowtie2 = "#{output_prefix}#{AmrMetricsService::COUNT_BOWTIE2_OUT}"
        expect(workflow_run).to receive(:output).with(output_count_bowtie2)
                                                .and_return(bowtie2_out_count)

        output_count_subsampled = "#{output_prefix}#{AmrMetricsService::COUNT_SUBSAMPLED_OUT}"
        expect(workflow_run).to receive(:output).with(output_count_subsampled)
                                                .and_return(subsampled_out_count)

        output_count_czid_dedup = "#{output_prefix}#{AmrMetricsService::COUNT_CZID_DEDUP_OUT}"
        expect(workflow_run).to receive(:output).with(output_count_czid_dedup)
                                                .and_return(czid_dedup_out_count)

        @output_ercc_file = "#{output_prefix}#{AmrMetricsService::ERCC_FILE}"
        allow(workflow_run).to receive(:output).with(@output_ercc_file)
                                               .and_return(ercc_file_lines)

        output_insert_size_metrics = "#{output_prefix}#{AmrMetricsService::INSERT_SIZE_METRICS}"
        allow(workflow_run).to receive(:output).with(output_insert_size_metrics)
                                               .and_return(insert_size_metrics_tsv)
      end

      it "returns total reads" do
        metrics = subject.call
        expect(metrics[WorkflowRun::TOTAL_READS_KEY]).to eq(input_read_val)
      end

      describe "#retrieve_passed_qc" do
        it "returns correct QC percent" do
          metrics = subject.call
          expect(metrics[WorkflowRun::QC_PERCENT_KEY]).to eq(expected_passed_qc)
        end

        context "when priceseq_out is nil" do
          let(:priceseq_out_val) { nil }

          it "returns nil QC percent" do
            metrics = subject.call
            expect(metrics[WorkflowRun::QC_PERCENT_KEY]).to be_nil
          end
        end

        context "when star_out is nil" do
          let(:star_out_val) { nil }

          it "returns nil QC percent" do
            metrics = subject.call
            expect(metrics[WorkflowRun::QC_PERCENT_KEY]).to be_nil
          end
        end
      end

      describe "remaining reads" do
        it "returns correct value for remaining reads" do
          metrics = subject.call
          expect(metrics[WorkflowRun::REMAINING_READS_KEY]).to eq(expected_remaining_reads)
        end

        context "when bowtie2_out count is <= 0" do
          let(:bowtie2_out_val) { 0 }
          let(:expected_remaining_reads) do
            subsampled_fraction = 1.0
            (gsnap_filter_out_val * (1 / subsampled_fraction)).to_i
          end

          it "returns correct value for remaining reads" do
            metrics = subject.call
            expect(metrics[WorkflowRun::REMAINING_READS_KEY]).to eq(expected_remaining_reads)
          end
        end

        context "when bowtie2_out is nil" do
          let(:bowtie2_out_val) { nil }

          it "returns nil remaining reads" do
            metrics = subject.call
            expect(metrics[WorkflowRun::REMAINING_READS_KEY]).to be_nil
          end
        end

        context "when subsampled_out is nil" do
          let(:subsampled_out_val) { nil }

          it "returns nil remaining reads" do
            metrics = subject.call
            expect(metrics[WorkflowRun::REMAINING_READS_KEY]).to be_nil
          end
        end

        context "when gsnap_filter_out is nil" do
          let(:gsnap_filter_out_val) { nil }

          it "returns nil remaining reads" do
            metrics = subject.call
            expect(metrics[WorkflowRun::REMAINING_READS_KEY]).to be_nil
          end
        end
      end

      describe "compression ratio" do
        it "returns correct value for compression ratio" do
          metrics = subject.call
          expect(metrics[WorkflowRun::COMPRESSION_RATIO_KEY]).to eq(expected_compression_ratio)
        end

        context "when priceseq_out is nil" do
          let(:priceseq_out_val) { nil }

          it "returns nil for compression ratio" do
            metrics = subject.call
            expect(metrics[WorkflowRun::COMPRESSION_RATIO_KEY]).to be_nil
          end
        end

        context "when czid_dedup_out is nil" do
          let(:czid_dedup_out_val) { nil }

          it "returns nil for compression ratio" do
            metrics = subject.call
            expect(metrics[WorkflowRun::COMPRESSION_RATIO_KEY]).to be_nil
          end
        end
      end

      describe "ERCC counts" do
        it "returns correct value for total ercc reads" do
          metrics = subject.call
          expect(metrics[WorkflowRun::TOTAL_ERCC_READS_KEY]).to eq(expected_ercc_count)
        end

        context "when ERCC counts cannot be loaded" do
          before do
            allow(workflow_run).to receive(:output).with(@output_ercc_file)
                                                   .and_raise(StandardError)
          end

          it "returns logs a warning" do
            expect(Rails.logger).to receive(:warn).with("Could not load ERCC counts")
            subject.call
          end
        end
      end

      describe "fraction subsampled" do
        it "returns correct value for fraction subsampled" do
          metrics = subject.call
          expect(metrics[WorkflowRun::SUBSAMPLED_FRACTION_KEY]).to eq(expected_subsampled_fraction)
        end

        context "when bowtie2_out count is <= 0" do
          let(:bowtie2_out_val) { 0 }

          it "returns correct value for remaining reads" do
            metrics = subject.call
            expect(metrics[WorkflowRun::SUBSAMPLED_FRACTION_KEY]).to eq(1.0)
          end
        end

        context "when bowtie2_out is nil" do
          let(:bowtie2_out_val) { nil }

          it "returns nil remaining reads" do
            metrics = subject.call
            expect(metrics[WorkflowRun::SUBSAMPLED_FRACTION_KEY]).to be_nil
          end
        end

        context "when subsampled_out is nil" do
          let(:subsampled_out_val) { nil }

          it "returns nil remaining reads" do
            metrics = subject.call
            expect(metrics[WorkflowRun::SUBSAMPLED_FRACTION_KEY]).to be_nil
          end
        end
      end

      describe "insert size metrics" do
        it "returns metrics parsed from file output" do
          metrics = subject.call
          expect(metrics[WorkflowRun::INSERT_SIZE_MEAN_KEY]).to eq(expected_insert_size_mean)
          expect(metrics[WorkflowRun::INSERT_SIZE_STD_DEV_KEY]).to eq(expected_insert_size_std_dev)
        end
      end

      describe "percent remaining" do
        it "returns the correct value for percent remaining" do
          metrics = subject.call
          expect(metrics[WorkflowRun::PERCENT_REMAINING_KEY]).to eq(expected_percent_remaining)
        end

        context "when total_reads is nil" do
          let(:input_read_val) { nil }

          it "returns nil for percentage remaining" do
            metrics = subject.call
            expect(metrics[WorkflowRun::PERCENT_REMAINING_KEY]).to be_nil
          end
        end
      end
    end
  end
end
