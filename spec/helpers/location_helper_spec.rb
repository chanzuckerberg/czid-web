# See deprecated test/helpers/location_helper_test.rb

require "rails_helper"
require_relative "../../test/test_helpers/location_test_helper.rb"
include LocationTestHelper

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
      expect(result).to eq("Chania, 73135, Greece")
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
        [nil, "Alaska, USA", "USA", "Alaska, USA"] => 1,
        [nil, "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece", "Greece", "Crete, Greece", "Chania, Crete, Greece", "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece"] => 1,
        [nil, "Hanoi, Vietnam", "Vietnam", "Hanoi, Vietnam"] => 1,
        [nil, "Redwood City, San Mateo County, California, USA", "USA", "California", "San Mateo County, California, USA", "Redwood City, San Mateo County, California, USA"] => 112,
        [nil, "Zimbabwe"] => 1
      }
      allow(SamplesHelper).to receive_message_chain(:samples_by_metadata_field, :count).and_return(mock_filtered)

      expected = [
        { value: "Alaska, USA", text: "Alaska, USA", count: 1, parents: ["USA"] },
        { value: "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece", text: "Chania, 73135, Greece", count: 1, parents: ["Greece", "Crete, Greece", "Chania, Crete, Greece"] },
        { value: "Hanoi, Vietnam", text: "Hanoi, Vietnam", count: 1, parents: ["Vietnam"] },
        { value: "Redwood City, San Mateo County, California, USA", text: "Redwood City, California, USA", count: 112, parents: ["USA", "California", "San Mateo County, California, USA"] },
        { value: "Zimbabwe", text: "Zimbabwe", count: 1, parents: [] },
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
        [nil, "Alaska, USA", "USA", "Alaska, USA"] => 1,
        [nil, "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece", "Greece", "Crete, Greece", "Chania, Crete, Greece", "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece"] => 1,
        [nil, "Hanoi, Vietnam", "Vietnam", "Hanoi, Vietnam"] => 1,
        [nil, "Redwood City, San Mateo County, California, USA", "USA", "California", "San Mateo County, California, USA", "Redwood City, San Mateo County, California, USA"] => 1,
        [nil, "Zimbabwe"] => 1
      }
      allow(SamplesHelper).to receive_message_chain(:samples_by_metadata_field, :includes, :distinct, :count).and_return(mock_filtered)

      expected = [
        { value: "Alaska, USA", text: "Alaska, USA", count: 1, parents: ["USA"] },
        { value: "Chania, Chania Municipality, Chania Regional Unit, Region of Crete, Crete, 73135, Greece", text: "Chania, 73135, Greece", count: 1, parents: ["Greece", "Crete, Greece", "Chania, Crete, Greece"]},
        { value: "Hanoi, Vietnam", text: "Hanoi, Vietnam", count: 1, parents: ["Vietnam"] },
        { value: "Redwood City, San Mateo County, California, USA", text: "Redwood City, California, USA", count: 1, parents: ["USA", "California", "San Mateo County, California, USA"] },
        { value: "Zimbabwe", text: "Zimbabwe", count: 1, parents: [] }
      ]
      result = LocationHelper.project_dimensions([1, 2, 3], field_name)
      expect(result).to eq(expected)
    end
  end

  describe "#filter_by_name" do
    pending "add test for filtering by location names (with Factories)"
  end

  describe "#adapt_location_iq_response" do
    it "formats a response for a city name without subdivision" do
      expected = LocationTestHelper::FORMATTED_GEOSEARCH_DHAKA_RESPONSE[0].symbolize_keys
      result = LocationHelper.adapt_location_iq_response(LocationTestHelper::API_GEOSEARCH_DHAKA_RESPONSE[0])
      expect(result).to eq(expected)
    end

    it "formats a response for a short country name without truncation" do
      expected = LocationTestHelper::FORMATTED_GEOSEARCH_UGANDA_RESPONSE[0].symbolize_keys
      result = LocationHelper.adapt_location_iq_response(LocationTestHelper::API_GEOSEARCH_UGANDA_RESPONSE[0])
      expect(result).to eq(expected)
    end
  end
end
