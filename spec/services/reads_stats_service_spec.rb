require "rails_helper"

RSpec.describe ReadsStatsService do
  context "when no samples are passed in" do
    it "returns an empty object" do
      expect(ReadsStatsService.call(nil).keys.length).to be(0)
      expect(ReadsStatsService.call([]).keys.length).to be(0)
    end
  end

  context "when samples and stats exist" do
    let(:project) { create(:project) }
    let(:sample) { create(:sample, project_id: project.id) }
    let(:pipeline_execution_strategy) { "step_function" }
    let(:pipeline_run_id) { 12_345 }
    let(:job_stats) do
      [
        ["unidentified_fasta", 7190],
        ["bowtie2_out", 1_436_232],
        ["cdhitdup_out", 38_178],
        ["fastqs", 1_932_176],
        ["gsnap_filter_out", 1_436_188],
        ["lzw_out", 1_436_232],
        ["priceseq_out", 1_436_390],
        ["unidentified_fasta", 7188],
        ["star_out", 1_932_176],
        ["subsampled_out", 1_436_232],
        ["subsampled", 1],
        ["trimmomatic_out", 1_562_744],
        ["validate_input_out", 1_932_176],
      ]
    end

    before do
      create(:pipeline_run,
             id: pipeline_run_id,
             sample_id: sample.id,
             pipeline_execution_strategy: pipeline_execution_strategy,
             job_status: PipelineRun::STATUS_CHECKED,
             finalized: 1,
             s3_output_prefix: nil)
      job_stats.each do |step, reads_after|
        create(:job_stat, task: step, reads_after: reads_after, pipeline_run_id: pipeline_run_id)
      end
    end

    context "#call" do
      it "correctly formats the return data" do
        stats = ReadsStatsService.call(Sample.where(id: sample.id))
        expect(stats.keys).to contain_exactly(sample.id)
        single_sample_stats = stats[sample.id]
        expect(single_sample_stats.keys).to contain_exactly(:steps, :initialReads, :sampleId, :wdlVersion, :pipelineVersion, :name)
        expect(single_sample_stats).to include(
          steps: instance_of(Array),
          initialReads: instance_of(Integer),
          sampleId: instance_of(Integer),
          wdlVersion: instance_of(String),
          pipelineVersion: instance_of(String),
          name: instance_of(String)
        )
        single_sample_stats[:steps].each do |step|
          expect(step).to include(
            name: instance_of(String),
            readsAfter: instance_of(Integer)
          )
        end
      end

      it "includes the 'subsampled_out' and not the 'subsampled' step" do
        stats = ReadsStatsService.call(Sample.where(id: sample.id))
        steps = stats[sample.id][:steps]
        subsampled_steps = steps.select { |s| s[:name] == "Subsampled" }
        subsampled_values = subsampled_steps.pluck(:readsAfter)
        expect(subsampled_values.length).to eq(1)
        expect(subsampled_values).not_to include(1)
        expect(subsampled_values).to contain_exactly(1_436_232)
      end

      it "returns the correct number of initial reads" do
        stats = ReadsStatsService.call(Sample.where(id: sample.id))
        expect(stats[sample.id][:initialReads]).to eq(1_932_176)
      end

      it "returns the correct numbers for each step" do
        not_host_filtering_stats = ["unidentified_fasta", "subsampled", "fastqs"]
        correct_job_stats = job_stats.reject { |s| not_host_filtering_stats.include?(s[0]) }

        stats = ReadsStatsService.call(Sample.where(id: sample.id))
        steps = stats[sample.id][:steps]
        expect(steps.length).to eq(correct_job_stats.length)
        humanized_names = correct_job_stats.map { |step_name, stat| [StringUtil.humanize_step_name(step_name), stat] }
        correct_stat_hash = humanized_names.to_h
        steps.each do |step, stat|
          expect(correct_stat_hash[step]).to eq(stat)
        end
      end
    end
  end
end
