require "rails_helper"

TIMER_PREFIX = "test_timer".freeze

def stub_clock(values, start: 1.0)
  mock_timestamp_values = values.inject([start]) { |arr, t| arr << arr[-1] + t }
  allow(Process).to receive(:clock_gettime) \
    .with(Process::CLOCK_MONOTONIC) \
    .and_return(*(mock_timestamp_values + [nil]))
end

RSpec.describe Timer do
  context "when creating a timer without splits" do
    describe ".publish" do
      it "publishes total time" do
        expected_elapsed = 0.5
        stub_clock([expected_elapsed])

        expect(MetricUtil).to receive(:put_metric_now)
          .with("#{TIMER_PREFIX}.timer", expected_elapsed, tags: [])

        subject_timer = Timer.new(TIMER_PREFIX)
        subject_timer.publish
      end
    end
  end

  context "when creating a timer with splits" do
    describe ".publish" do
      it "publishes total and split time " do
        expected_elapsed_splits = [0.5, 0.3, 0.9]
        stub_clock(expected_elapsed_splits)
        expected_elapsed_split_names = ["step_1", "step_2"]

        expect(MetricUtil).to receive(:put_metric_now)
          .with("#{TIMER_PREFIX}.timer", expected_elapsed_splits.inject(:+), tags: [])
        (expected_elapsed_split_names + ["last"]).each_with_index do |split_name, idx|
          expect(MetricUtil).to receive(:put_metric_now)
            .with("#{TIMER_PREFIX}.timer.splits", expected_elapsed_splits[idx], tags: ["split:#{split_name}"])
        end

        subject_timer = Timer.new(TIMER_PREFIX)
        (0...expected_elapsed_splits.length - 1).each do |i|
          subject_timer.split(expected_elapsed_split_names[i])
        end
        subject_timer.publish
      end
    end
  end

  context "when creating a timer with splits and tags" do
    describe ".publish" do
      it "publishes with extra tags" do
        expected_elapsed_split_names = ["step_1", "step_2"]
        expected_tags = ["tag_name:test_tag"]

        expect(MetricUtil).to receive(:put_metric_now)
          .with("#{TIMER_PREFIX}.timer", anything, tags: array_including(expected_tags))
        (expected_elapsed_split_names + ["last"]).each do |_split_name|
          expect(MetricUtil).to receive(:put_metric_now)
            .with("#{TIMER_PREFIX}.timer.splits", anything, tags: array_including(expected_tags))
        end

        subject_timer = Timer.new(TIMER_PREFIX)
        subject_timer.add_tags(expected_tags)
        expected_elapsed_split_names.each do |split_name|
          subject_timer.split(split_name)
        end
        subject_timer.publish
      end
    end
  end

  context "when adding duplicate tags" do
    describe ".add_tags" do
      it "deduplicates tags" do
        expected_elapsed_split_names = ["step_1", "step_2"]
        expected_tags = ["tag_name:test_tag"]

        expect(MetricUtil).to receive(:put_metric_now)
          .with("#{TIMER_PREFIX}.timer", anything, tags: contain_exactly(*expected_tags))
        (expected_elapsed_split_names + ["last"]).each do |split_name|
          expect(MetricUtil).to receive(:put_metric_now)
            .with("#{TIMER_PREFIX}.timer.splits", anything, tags: contain_exactly(*(["split:#{split_name}"] + expected_tags)))
        end

        subject_timer = Timer.new(TIMER_PREFIX, tags: expected_tags)
        subject_timer.add_tags(expected_tags)
        expected_elapsed_split_names.each do |split_name|
          subject_timer.split(split_name)
        end
        subject_timer.publish
      end
    end
  end
end
