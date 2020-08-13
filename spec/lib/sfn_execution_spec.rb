require "rails_helper"

RSpec.describe SfnExecution do
  let(:fake_output_prefix) { "s3://fake-output-prefix" }
  let(:fake_sfn_name) { "fake_sfn_name" }
  let(:fake_sfn_arn) { "fake:sfn:arn".freeze }
  let(:fake_s3_path) { "s3://fake_bucket/fake/path".freeze }
  let(:fake_sfn_execution_arn) { "fake:sfn:execution:arn:#{fake_sfn_name}".freeze }
  let(:fake_error) { "fake_error" }
  let(:fake_sfn_execution_description) do
    {
      execution_arn: fake_sfn_execution_arn,
      input: "{}",
      # AWS SDK rounds to second
      start_date: Time.zone.now.round,
      state_machine_arn: fake_sfn_arn,
      status: "SUCCESS",
    }
  end
  let(:fake_error_sfn_execution_description) do
    {
      execution_arn: fake_sfn_execution_arn,
      input: JSON.dump(OutputPrefix: fake_output_prefix),
      start_date: Time.zone.now.round,
      state_machine_arn: fake_sfn_arn,
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

  before do
    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
      states: Aws::States::Client.new(stub_responses: true),
    }
    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }
  end

  subject(:sfn_execution) { SfnExecution.new(fake_sfn_execution_arn, fake_s3_path) }

  describe "#description" do
    context "when arn exists" do
      it "returns description" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, lambda { |context|
          context.params[:execution_arn] == fake_sfn_execution_arn ? fake_sfn_execution_description : 'ExecutionDoesNotExist'
        })

        expect(sfn_execution.description).to have_attributes(fake_sfn_execution_description)
      end
    end

    context "when arn does not exist" do
      before do
        @mock_aws_clients[:states].stub_responses(:describe_execution, 'ExecutionDoesNotExist')
      end

      it "returns description from s3" do
        fake_s3_description_path = File.join(fake_s3_path.split("/", 4)[-1], "sfn-desc", fake_sfn_execution_arn)
        fake_bucket = { fake_s3_description_path => { body: JSON.dump(fake_sfn_execution_description) } }
        @mock_aws_clients[:s3].stub_responses(:get_object, lambda { |context|
          fake_bucket[context.params[:key]] || 'NoSuchKey'
        })

        # ATTENTION: if loading a JSON from S3 json time fields will come as strings
        expected_description = fake_sfn_execution_description.merge(
          start_date: fake_sfn_execution_description[:start_date].to_s
        )
        expect(sfn_execution.description).to eq(expected_description)
      end

      context "and s3_path is nil" do
        let(:fake_s3_path) { nil }
        it { expect(sfn_execution.description).to be_nil }
      end
    end

    context "when arn is nil" do
      let(:fake_sfn_execution_arn) { nil }
      it { expect(sfn_execution.description).to be_nil }
    end

    it "should memoize result" do
      @mock_aws_clients[:states].stub_responses(:describe_execution, fake_sfn_execution_description)
      expect(sfn_execution).to receive(:description_from_aws).once.and_call_original
      sfn_execution.description
      expect(sfn_execution.description).to have_attributes(fake_sfn_execution_description)
    end
  end

  context "#history" do
    context "when arn exists" do
      it "returns history" do
        @mock_aws_clients[:states].stub_responses(:get_execution_history, lambda { |context|
          context.params[:execution_arn] == fake_sfn_execution_arn ? fake_error_sfn_execution_history : 'ExecutionDoesNotExist'
        })

        sfn_execution.history[:events].each_with_index do |event, idx|
          expect(event).to have_attributes(
            execution_failed_event_details: have_attributes(fake_error_sfn_execution_history[:events][idx][:execution_failed_event_details])
          )
        end
      end
    end

    context "when arn does not exist" do
      before do
        @mock_aws_clients[:states].stub_responses(:get_execution_history, 'ExecutionDoesNotExist')
      end

      it "returns history from s3" do
        fake_s3_history_path = File.join(fake_s3_path.split("/", 4)[-1], "sfn-hist", fake_sfn_execution_arn)
        fake_bucket = { fake_s3_history_path => { body: JSON.dump(fake_error_sfn_execution_history) } }
        @mock_aws_clients[:s3].stub_responses(:get_object, lambda { |context|
          fake_bucket[context.params[:key]] || 'NoSuchKey'
        })

        # ATTENTION: if loading a JSON from S3 json time fields will come as strings
        fake_error_sfn_execution_history[:events].map! { |event| event.merge(timestamp: event[:timestamp].to_s) }

        expect(sfn_execution.history).to eq(fake_error_sfn_execution_history)
      end

      context "and s3_path is nil" do
        let(:fake_s3_path) { nil }
        it { expect(sfn_execution.history).to be_nil }
      end
    end

    context "when arn is nil" do
      let(:fake_sfn_execution_arn) { nil }
      it { expect(sfn_execution.history).to be_nil }
    end

    it "should memoize result" do
      @mock_aws_clients[:states].stub_responses(:get_execution_history, fake_error_sfn_execution_history)
      expect(sfn_execution).to receive(:history_from_aws).once.and_call_original

      sfn_execution.history
      sfn_execution.history[:events].each_with_index do |event, idx|
        expect(event).to have_attributes(
          execution_failed_event_details: have_attributes(fake_error_sfn_execution_history[:events][idx][:execution_failed_event_details])
        )
      end
    end
  end

  context "#sfn_error" do
    context "when pipeline is successful" do
      it "returns nil" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_sfn_execution_description)

        expect(sfn_execution.error).to be_nil
      end
    end

    context "when pipeline failed" do
      it "returns error info" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, fake_error_sfn_execution_description)
        @mock_aws_clients[:states].stub_responses(:get_execution_history, fake_error_sfn_execution_history)

        expect(sfn_execution.error).to eq(fake_error)
      end
    end

    context "when arn and s3 data does not exist" do
      it "returns nil" do
        @mock_aws_clients[:states].stub_responses(:describe_execution, 'ExecutionDoesNotExist')
        @mock_aws_clients[:s3].stub_responses(:get_object, 'NoSuchKey')
        expect(sfn_execution.error).to be_nil
      end
    end
  end
end
