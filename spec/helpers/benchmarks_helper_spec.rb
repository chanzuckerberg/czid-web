require 'rails_helper'

RSpec::Matchers.define_negated_matcher :array_excluding, :include

RSpec.describe BenchmarksHelper, type: :helper do
  describe "#load_benchmarks_config" do
    let(:benchmark_config_json) { JSON.generate("sample_key": "sample_value") }
    let(:benchmark_config_symbolized_json) { JSON.parse(benchmark_config_json).deep_symbolize_keys() }

    subject { helper.load_benchmarks_config }

    before do
      s3 = Aws::S3::Client.new(stub_responses: true)
      s3.stub_responses(:get_object, lambda { |context|
        obj = buckets.dig(context.params[:bucket], context.params[:key])
        return obj || "NoSuchKey"
      })
      stub_const("S3_CLIENT", s3)

      allow(LogUtil).to receive(:log_err)
    end

    context "when config is available" do
      let(:buckets) do
        {
          BenchmarksHelper::IDSEQ_BENCH_BUCKET => {
            BenchmarksHelper::IDSEQ_BENCH_KEY => {
              body: benchmark_config_json,
            },
          },
        }
      end

      it "returns config JSON with symbolic key" do
        expect(subject).to eq(benchmark_config_symbolized_json)
      end
    end

    context "when config is not available" do
      let(:buckets) do
        {
          BenchmarksHelper::IDSEQ_BENCH_BUCKET => {},
        }
      end

      it "returns nil" do
        expect(subject).to be_nil
      end

      it "logs a not found exception" do
        subject
        expect(LogUtil).to have_received(:log_err).with(match(/Config file not found/))
      end
    end

    context "when config JSON is invalid" do
      let(:buckets) do
        {
          BenchmarksHelper::IDSEQ_BENCH_BUCKET => {
            BenchmarksHelper::IDSEQ_BENCH_KEY => {
              body: "{Invalid JSON}",
            },
          },
        }
      end

      it "returns nil" do
        expect(subject).to be_nil
      end

      it "logs a invalid JSON exception" do
        subject
        expect(LogUtil).to have_received(:log_err).with(match(/Invalid config file/))
      end
    end
  end

  describe "#parse_config" do
    subject { helper.parse_config(benchmark_config) }

    context "with valid config" do
      context "for single environment" do
        let(:benchmark_config) do
          {
            "defaults": {
              "default_field": "Default Value",
              "environments": ["test"],
            },
            "active_benchmarks": { "active_test_benchmark_path": {} },
            "retired_benchmarks": { "retired_test_benchmark_path": {} },
          }
        end

        it "merges default fields" do
          expect(subject).to match(
            hash_including(
              active_benchmarks: array_including(
                hash_including(default_field: "Default Value")
              ),
              retired_benchmarks: array_including(
                hash_including(default_field: "Default Value")
              )
            )
          )
        end

        it "merges path field" do
          expect(subject).to match(
            hash_including(
              active_benchmarks: array_including(
                hash_including(path: "active_test_benchmark_path")
              ),
              retired_benchmarks: array_including(
                hash_including(path: "retired_test_benchmark_path")
              )
            )
          )
        end
      end

      context "for multiple environments" do
        let(:benchmark_config) do
          {
            "active_benchmarks": {
              "active_test_benchmark_path": { "environments": ["test"] },
              "active_prod_benchmark_path": { "environments": ["prod"] },
            },
            "retired_benchmarks": {
              "retired_test_benchmark_path": { "environments": ["test"] },
              "retired_prod_benchmark_path": { "environments": ["prod"] },
            },
          }
        end

        it "filters environments" do
          expect(subject).to match(
            hash_including(
              active_benchmarks: array_excluding(
                hash_including(path: "active_prod_benchmark_path")
              ),
              retired_benchmarks: array_excluding(
                hash_including(path: "retired_prod_benchmark_path")
              )
            )
          )
        end
      end
    end
  end

  describe "#benchmarks_list" do
    subject { helper.benchmarks_list() }

    let(:project_name) { "Bench Project" }

    before do
      allow(helper).to receive(:load_benchmarks_config) {
        {
          "defaults": {
            "project_name": project_name,
            "environments": ["test"],
          },
          "active_benchmarks": {
            "active_test_benchmark_path": {},
          },
          "retired_benchmarks": {
            "retired_test_benchmark_path": {},
          },
        }
      }
    end

    it "returns list of benchmarks" do
      expect(subject).to match(
        hash_including(
          active_benchmarks: array_including(
            hash_including(path: "active_test_benchmark_path")
          ),
          retired_benchmarks: array_including(
            hash_including(path: "retired_test_benchmark_path")
          )
        )
      )
    end

    it "returns nil as last run when project does not exist" do
      expect(subject).to match(
        hash_including(
          active_benchmarks: array_including(
            hash_including(last_run: nil)
          )
        )
      )
    end

    it "returns last run nil for projects with samples" do
      create(:project, name: project_name)

      expect(subject).to match(
        hash_including(
          active_benchmarks: array_including(
            hash_including(last_run: nil)
          )
        )
      )
    end

    it "include sample info for active but not for retired benchmarks" do
      project = create(:project, name: project_name)
      sample = create(:sample, project: project)
      pipeline_run = create(:pipeline_run, sample: sample, pipeline_version: "5.0")

      expect(subject).to match(
        hash_including(
          active_benchmarks: array_including(
            hash_including(
              last_run: {
                sample_name: sample.name,
                pipeline_version: pipeline_run.pipeline_version,
              }
            )
          ),
          retired_benchmarks: array_excluding(
            hash_including(:last_run)
          )
        )
      )
    end
  end
end
