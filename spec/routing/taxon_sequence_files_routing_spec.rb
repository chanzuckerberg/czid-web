require "rails_helper"

RSpec.describe TaxonSequenceFilesController, type: :routing do
  describe "routing" do
    it "routes to #index" do
      expect(get: "/taxon_sequence_files").to route_to("taxon_sequence_files#index")
    end

    it "routes to #new" do
      expect(get: "/taxon_sequence_files/new").to route_to("taxon_sequence_files#new")
    end

    it "routes to #show" do
      expect(get: "/taxon_sequence_files/1").to route_to("taxon_sequence_files#show", id: "1")
    end

    it "routes to #edit" do
      expect(get: "/taxon_sequence_files/1/edit").to route_to("taxon_sequence_files#edit", id: "1")
    end

    it "routes to #create" do
      expect(post: "/taxon_sequence_files").to route_to("taxon_sequence_files#create")
    end

    it "routes to #update via PUT" do
      expect(put: "/taxon_sequence_files/1").to route_to("taxon_sequence_files#update", id: "1")
    end

    it "routes to #update via PATCH" do
      expect(patch: "/taxon_sequence_files/1").to route_to("taxon_sequence_files#update", id: "1")
    end

    it "routes to #destroy" do
      expect(delete: "/taxon_sequence_files/1").to route_to("taxon_sequence_files#destroy", id: "1")
    end
  end
end
