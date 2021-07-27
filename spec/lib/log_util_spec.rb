require "rails_helper"

RSpec.describe LogUtil do
  describe "#log_error" do
    let(:subject) { LogUtil }
    let(:message) { "This is a fake message" }
    let(:details) do
      {
        detail1: "this is a detail",
        detail2: 2,
        detail3: "this is another detail",
      }
    end
    let(:zero_division_error) do
      ZeroDivisionError.new("divided by 0")
    end

    it "should log error" do
      expect(Raven).to receive(:capture_exception).with(zero_division_error, hash_including(message: message, extra: {}))
      subject.log_error(message, exception: zero_division_error)
    end

    it "should log error with details" do
      expect(Raven).to receive(:capture_exception).with(zero_division_error, hash_including(message: message, extra: details))
      subject.log_error(message, exception: zero_division_error, **details)
    end
  end

  describe "#log_message" do
    let(:subject) { LogUtil }
    let(:message) { "This is a fake message" }
    let(:level) { "info" }
    let(:details) do
      {
        detail1: "this is a detail",
        detail2: 2,
        detail3: "this is another detail",
      }
    end

    it "should log message" do
      expect(Raven).to receive(:capture_message).with(message, hash_including(level: "info", extra: {}))
      subject.log_message(message)
    end

    it "should log message with details" do
      expect(Raven).to receive(:capture_message).with(message, hash_including(level: "info", extra: details))
      subject.log_message(message, **details)
    end
  end
end
