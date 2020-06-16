require 'test_helper'

class BackgroundTest < ActiveSupport::TestCase
  setup do
    @project = Project.new()
    @sample_one = Sample.new(project: @project)
    @sample_two = Sample.new(project: @project)
    @alignment_config = AlignmentConfig.all[0]
  end

  test "accepts background mass normalized models with two pipeline runs with erccs" do
    pipeline_run_one = PipelineRun.new(
      total_ercc_reads: 2,
      sample: @sample_one,
      alignment_config: @alignment_config
    )
    pipeline_run_one.save
    pipeline_run_two = PipelineRun.new(
      total_ercc_reads: 2,
      sample: @sample_two,
      alignment_config: @alignment_config
    )
    pipeline_run_two.save
    background = Background.new(
      pipeline_runs: [pipeline_run_one, pipeline_run_two],
      mass_normalized: true,
      name: 'test'
    )
    assert background.validate
  end

  test "rejects background models with one pipeline run without erccs" do
    pipeline_run_one = PipelineRun.new(
      total_ercc_reads: 2,
      sample: @sample_one,
      alignment_config: @alignment_config
    )
    pipeline_run_one.save
    background = Background.new(
      pipeline_runs: [pipeline_run_one],
      mass_normalized: true,
      name: 'test'
    )
    assert_not background.validate
    assert_equal background.errors.full_messages[0], 'Need to select at least 2 pipeline runs.'
  end

  test "rejects background mass normalized models with two pipeline runs when one has no erccs" do
    pipeline_run_one = PipelineRun.new(
      total_ercc_reads: 2,
      sample: @sample_one,
      alignment_config: @alignment_config
    )
    pipeline_run_one.save
    pipeline_run_two = PipelineRun.new(
      sample: @sample_two,
      alignment_config: @alignment_config
    )
    pipeline_run_two.save
    background = Background.new(
      pipeline_runs: [pipeline_run_one, pipeline_run_two],
      mass_normalized: true,
      name: 'test'
    )
    assert_not background.validate
  end
end
