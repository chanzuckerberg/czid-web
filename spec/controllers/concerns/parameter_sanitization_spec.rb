require 'rails_helper'

RSpec.describe ParameterSanitization do
  let(:subject) { Class.new { extend ParameterSanitization } }

  describe "#sanitize_accession_id" do
    it "removes invalid characters from the input" do
      expect(subject.sanitize_accession_id("MN908947.3; echo")).to eq("MN908947.3")
      expect(subject.sanitize_accession_id("mn-\9 08947.3;")).to eq("908947.3")
    end

    it "allows valid accession ids" do
      expect(subject.sanitize_accession_id("GQ398265.1")).to eq("GQ398265.1")
    end

    it "allows nil input" do
      expect(subject.sanitize_accession_id(nil)).to eq(nil)
    end
  end
end
