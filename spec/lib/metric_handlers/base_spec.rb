require "rails_helper"
require_all "lib/metric_handlers"

RSpec.describe MetricHandlers::Base do
  let(:subject) { MetricHandlers::Base.new }

  describe "#call" do
    let(:name) { "process_action.action_controller" }
    let(:started) { 10.seconds.ago }
    let(:finished) { 5.seconds.ago }
    let(:unique_id) { "fake-03db3ebe2aab953ecf86" }
    let(:samples_payload) { { controller: "SamplesController", action: "stats" } }
    let(:health_check_payload) { { controller: "HealthCheck::HealthCheckController", action: "index" } }

    it "calls process event on regular events" do
      expect(subject).to receive(:process_event)

      subject.call(name, started, finished, unique_id, samples_payload)
    end

    it "calls process event on empty payload (not expected)" do
      expect(subject).to receive(:process_event)

      subject.call(name, started, finished, unique_id, {})
    end

    it "ignores the health check controller" do
      expect(subject).not_to receive(:process_event)

      subject.call(name, started, finished, unique_id, health_check_payload)
    end
  end
end
