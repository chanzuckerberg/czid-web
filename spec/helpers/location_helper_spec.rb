# See deprecated test/helpers/location_helper_test.rb

require "rails_helper"

RSpec.describe LocationHelper, type: :helper do
  describe "#sanitize_name" do
    it "sanitizes a name" do
      name = "California, USA; DROP TABLE USERS; <div></div>"
      result = LocationHelper.sanitize_name(name)
      expect(result).to eq("California, USA DROP TABLE USERS divdiv")
    end
  end

  describe "#truncate_name" do
    it "truncates a name" do
      name = "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece"
      result = LocationHelper.truncate_name(name)
      expect(result).to eq("Chania, Chania Municipality, 73135, Greece")
    end

    it "doesn't truncate shorter names" do
      name = "Alaska, USA"
      result = LocationHelper.truncate_name(name)
      expect(result).to eq("Alaska, USA")
    end
  end

  # TODO: These tests would be improved with Factories and SamplesHelper tests
  describe "#sample_dimensions" do
    it "gets and formats sample location dimensions" do
      sample_ids = [1, 2, 3]
      field_name = "collection_location_v2"
      mock_filtered = {
        [nil, "Alaska, USA"] => 1,
        [nil, "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece"] => 1,
        [nil, "Hanoi, Vietnam"] => 1,
        [nil, "Redwood City, San Mateo County, California, USA"] => 112,
        [nil, "Zimbabwe"] => 1
      }
      allow(SamplesHelper).to receive_message_chain(:samples_by_metadata_field, :count).and_return(mock_filtered)

      expected = [
        { value: "Alaska, USA", text: "Alaska, USA", count: 1 },
        { value: "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece", text: "Chania, Chania Municipality, 73135, Greece", count: 1 },
        { value: "Hanoi, Vietnam", text: "Hanoi, Vietnam", count: 1 },
        { value: "Redwood City, San Mateo County, California, USA", text: "Redwood City, San Mateo County, California, USA", count: 112 },
        { value: "Zimbabwe", text: "Zimbabwe", count: 1 },
        { value: "not_set", text: "Unknown", count: 740 }
      ]
      result = LocationHelper.sample_dimensions(sample_ids, field_name, 856)
      expect(result).to eq(expected)
    end
  end

  # TODO: These tests would be improved with Factories and SamplesHelper tests
  describe "#project_dimensions" do
    it "gets and formats project location dimensions" do
      field_name = "collection_location_v2"
      mock_filtered = {
        [nil, "Alaska, USA"] => 1,
        [nil, "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece"] => 1,
        [nil, "Hanoi, Vietnam"] => 1,
        [nil, "Redwood City, San Mateo County, California, USA"] => 1,
        [nil, "Zimbabwe"] => 1
      }
      allow(SamplesHelper).to receive_message_chain(:samples_by_metadata_field, :includes, :distinct, :count).and_return(mock_filtered)

      expected = [
        { value: "Alaska, USA", text: "Alaska, USA", count: 1 },
        { value: "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece", text: "Chania, Chania Municipality, 73135, Greece", count: 1 },
        { value: "Hanoi, Vietnam", text: "Hanoi, Vietnam", count: 1 },
        { value: "Redwood City, San Mateo County, California, USA", text: "Redwood City, San Mateo County, California, USA", count: 1 },
        { value: "Zimbabwe", text: "Zimbabwe", count: 1 }
      ]
      result = LocationHelper.project_dimensions([1, 2, 3], field_name)
      expect(result).to eq(expected)
    end
  end

  describe "#filter_by_name" do
    pending "add test for filtering by location names (with Factories)"
  end
end
