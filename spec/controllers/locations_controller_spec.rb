require 'rails_helper'

RSpec.describe LocationsController, type: :controller do
  describe "#external_search_action" do
    # Probably going to point to the other tests
  end

  describe "#handle_external_search_results" do
    it "zips/interpolates autocomplete and geosearch results" do
    end

    it "filters by OSM search type" do
    end

    it "de-duplicates by name/geo_level, and osm_id" do
    end

    it "doesn't error on empty results" do
    end
  end
end
