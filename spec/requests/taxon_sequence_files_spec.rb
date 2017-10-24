require 'rails_helper'

RSpec.describe "TaxonSequenceFiles", type: :request do
  describe "GET /taxon_sequence_files" do
    it "works! (now write some real specs)" do
      get taxon_sequence_files_path
      expect(response).to have_http_status(200)
    end
  end
end
