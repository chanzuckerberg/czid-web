require "rails_helper"

RSpec.describe MngsReadsStatsLoadService do
  let(:fake_sample_bucket) { ENV['SAMPLES_BUCKET_NAME'] }
  let(:fake_arn) { "fake-arn" }

  context "when workflow is short-read-mngs" do
    let(:workflow) { WorkflowRun::WORKFLOW[:short_read_mngs] }
    let(:fake_short_read_version) { "short-read-mngs-7" }
    before do
      @steps = {
        "fastqs": 1122,
        "validate_input_out": 1122,
        "star_out": 832,
        "trimmomatic_out": 644,
        "truncated": 644,
        "priceseq_out": 362,
        "lzw_out": 360,
        "czid_dedup_out": 356,
        "subsampled_out": 332,
        "bowtie2_out": 332,
        "gsnap_filter_out": 330,
        "unidentified_fasta": 12,
      }

      # Count files are found under the workflow version prefix,
      # named "step.count", and contents will be formatted
      # {step: <counts_remaining>}
      count_files = @steps.map do |k, v|
  [
    "#{fake_short_read_version}/#{k}.count",
    { body: { "#{k}": v.to_s }.to_json },
  ]
end                    .to_h

      @mock_aws_clients = {
        s3: Aws::S3::Client.new(stub_responses: true),
      }
      allow(AwsClient).to receive(:[]) { |client|
        @mock_aws_clients[client]
      }
      @mock_aws_clients[:s3].stub_responses(
        :list_objects_v2, contents: count_files.keys.map do |filename|
            { key: File.join("#{fake_sample_bucket}/#{fake_short_read_version}/", filename) }
          end
      )
      @mock_aws_clients[:s3].stub_responses(
        :get_object, lambda { |context|
          return count_files[context.params[:key]]
        }
      )

      @pipeline_run = create(:pipeline_run,
                             technology: PipelineRun::TECHNOLOGY_INPUT[:illumina],
                             pipeline_execution_strategy: "step_function",
                             s3_output_prefix: fake_sample_bucket,
                             sfn_execution_arn: fake_arn,
                             wdl_version: "7.0")
      @response = MngsReadsStatsLoadService.call(@pipeline_run)
    end

    it "should load job stats from s3 *.count files into JobStats" do
      job_stats = @pipeline_run.job_stats
      expect(job_stats.pluck(:task, :reads_after)).to match_array(@steps.map { |k, v| [k.to_s, v] })
    end

    it "should set attributes on the pipeline run instance" do
      expect(@pipeline_run.total_reads).to eq(@steps[:fastqs])
      expect(@pipeline_run.truncated).to eq(@steps[:truncated])
      expect(@pipeline_run.adjusted_remaining_reads).to eq(@steps[:gsnap_filter_out])
    end
  end

  context "when workflow is long-read-mngs" do
    let(:workflow) { WorkflowRun::WORKFLOW[:long_read_mngs] }
    let(:fake_short_read_version) { "long-read-mngs-1" }
    before do
      @steps = {
        "host_filtered_bases": 4_665_640,
        "host_filtered_reads": 1402,
        "human_filtered_bases": 3_451_961,
        "human_filtered_reads": 1118,
        "original_bases": 59_709_854,
        "original_reads": 20_000,
        "quality_filtered_bases": 59_700_618,
        "quality_filtered_reads": 19_984,
        "subsampled_bases": 3_451_961,
        "subsampled_reads": 1118,
        "validated_bases": 59_709_854,
        "validated_reads": 20_000,
      }

      # Count files are found under the workflow version prefix,
      # named "step.count", and contents will be formatted
      # {step: <counts_remaining>}
      count_files = @steps.map do |k, v|
  [
    "#{fake_short_read_version}/#{k}.count",
    { body: { "#{k}": v.to_s }.to_json },
  ]
end                    .to_h

      @mock_aws_clients = {
        s3: Aws::S3::Client.new(stub_responses: true),
      }
      allow(AwsClient).to receive(:[]) { |client|
        @mock_aws_clients[client]
      }
      @mock_aws_clients[:s3].stub_responses(
        :list_objects_v2, contents: count_files.keys.map do |filename|
            { key: File.join("#{fake_sample_bucket}/#{fake_short_read_version}/", filename) }
          end
      )
      @mock_aws_clients[:s3].stub_responses(
        :get_object, lambda { |context|
          return count_files[context.params[:key]]
        }
      )

      @pipeline_run = create(:pipeline_run,
                             technology: PipelineRun::TECHNOLOGY_INPUT[:nanopore],
                             pipeline_execution_strategy: "step_function",
                             s3_output_prefix: fake_sample_bucket,
                             sfn_execution_arn: fake_arn,
                             wdl_version: "1.0")
      @response = MngsReadsStatsLoadService.call(@pipeline_run)
    end

    it "should load job stats from s3 *.count files into JobStats" do
      job_stats_reads, job_stats_bases = @pipeline_run.job_stats.partition { |stat| stat.task.include?("reads") }
      steps_reads, steps_bases = @steps.partition { |k, _v| k.to_s.include?("reads") }
      expect(job_stats_reads.pluck(:task, :reads_after)).to match_array(steps_reads.map { |k, v| [k.to_s, v] })
      expect(job_stats_bases.pluck(:task, :bases_after)).to match_array(steps_bases.map { |k, v| [k.to_s, v] })
    end

    it "should set attributes on the pipeline run instance" do
      expect(@pipeline_run.total_reads).to eq(@steps[:original_reads])
      expect(@pipeline_run.total_bases).to eq(@steps[:original_bases])
      expect(@pipeline_run.truncated).to eq(@steps[:validated_reads])
      expect(@pipeline_run.truncated_bases).to eq(@steps[:validated_bases])
      expect(@pipeline_run.fraction_subsampled).to eq(1.0)
      expect(@pipeline_run.fraction_subsampled_bases).to eq(1.0)
      expect(@pipeline_run.adjusted_remaining_reads).to eq(@steps[:subsampled_reads])
    end
  end
end
