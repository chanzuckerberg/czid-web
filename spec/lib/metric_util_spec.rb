require "rails_helper"

RSpec.describe MetricUtil do
  describe "#a_test?" do
    it "returns true when running in RSpec" do
      expect(MetricUtil.send(:a_test?)).to eq(true)
    end

    it "returns false when env is overridden" do
      temp = Rails.env
      begin
        Rails.env = "asdf"
        expect(MetricUtil.send(:a_test?)).to eq(false)
      rescue StandardError => err
        raise err
      ensure
        Rails.env = temp
      end
    end
  end
end
