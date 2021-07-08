require "rails_helper"

RSpec.describe LogUtil do
  describe "#log_message" do
    let(:subject) { LogUtil }
    let(:message) { "This is a fake message" }
    let(:level) { "warning" }
    let(:details) do
      {
        detail1: "this is a detail",
        detail2: 2,
        detail3: "this is another detail",
      }
    end

    it "should log message" do
      expect(Raven).to receive(:capture_message).with(message, hash_including(extra: {}))
      subject.log_message(message)
    end

    it "should log message with details" do
      expect(Raven).to receive(:capture_message).with(message, hash_including(extra: details))
      subject.log_message(message, **details)
    end

    it "should log message with level set to 'warning'" do
      expect(Raven).to receive(:capture_message).with(message, hash_including(level: level, extra: details))
      subject.log_message(message, level: level, **details)
    end
  end
end
