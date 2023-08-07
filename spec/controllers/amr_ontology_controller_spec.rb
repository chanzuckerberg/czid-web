require 'rails_helper'
require 'webmock/rspec'

ONTOLOGY_BUILD_DATE = "2019-08-14".freeze

OQXB_LABEL = "oqxB".freeze
OQXB_ACCESSION = "3003923".freeze
OQXB_DESCRIPTION = "RND efflux pump conferring resistance to fluoroquinolone".freeze
OQXB_GENE_FAMILY_LABEL = "subunit of efflux pump conferring antibiotic resistance".freeze
OQXB_GENE_FAMILY_DESC = "Subunits of efflux proteins that pump antibiotic out of a cell to confer resistance.".freeze
OQXB_DRUG_CLASS_LABEL = "Fluroquinolones".freeze
OQXB_DRUG_CLASS_DESC = "The fluoroquinolones are a family of synthetic broad-spectrum antibiotics that are 4-quinolone-3-carboxylates. These compounds interact with topoisomerase II (DNA gyrase) to disrupt bacterial DNA replication, damage DNA, and cause cell death.".freeze
OQXB_PUBLICATION = "Kim HB1, Wang M, Park CH, Kim EC, Jacoby GA, Hooper DC. oqxAB encoding a multidrug efflux pump in human clinical isolates of Enterobacteriaceae. (PMID 19528276)".freeze
OQXB_GENBANK_ACCESSION = "EU370913".freeze

OQXB_ONTOLOGY = {
  "accession" => OQXB_ACCESSION,
  "label" => OQXB_LABEL,
  "synonyms" => [],
  "description" => OQXB_DESCRIPTION,
  "geneFamily" => [
    {
      "label" => OQXB_GENE_FAMILY_LABEL,
      "description" => OQXB_GENE_FAMILY_DESC,
    },
  ],
  "drugClass" => {
    "label" => OQXB_DRUG_CLASS_LABEL,
    "description" => OQXB_DRUG_CLASS_DESC,
  },
  "publications" => [
    OQXB_PUBLICATION,
  ],
  "genbankAccession" => OQXB_GENBANK_ACCESSION,
  "error" => "",
}.freeze

RSpec.describe AmrOntologyController, type: :controller do
  create_users

  # Regular Joe context
  context 'Joe' do
    # create users
    before do
      sign_in @joe
    end

    describe "GET ontology information" do
      before do
        s3 = Aws::S3::Client.new(stub_responses: true)
        s3.stub_responses(:list_objects_v2, lambda { |context|
          return {
            is_truncated: false,
            contents: [
              {
                key: "amr/ontology/#{ONTOLOGY_BUILD_DATE}/aro.json",
                last_modified: Time.new(2019, 0o6, 20, 18, 30, 0, "-07:00"),
                etag: "\"d70a48922d199eb2dd1ea1186c8998df\"",
                size: 2_820_541,
                storage_class: "STANDARD",
              },
            ],
            name: context.params[:bucket].to_s,
            prefix: context.params[:prefix].to_s,
            max_keys: 1000,
            key_count: 1,
          }
        })
        stub_const("S3_CLIENT", s3)
      end
      context "when a matching gene name is found" do
        before do
          # The comma is added to emulate the JSON delimiter between entries.
          # Although in this instance we are only returning one entry,
          # S3 always adds the comma at the end.
          allow(S3Util).to receive(:s3_select_json).and_return(OQXB_ONTOLOGY.to_json + ",")
          stub_const("S3_DATABASE_BUCKET", "czid-public-references")
        end

        it "should return relevant information from the Ontology JSON stored on s3" do
          get :fetch_ontology, params: { geneName: "oqxb" }
          expect(response.content_type).to include("application/json")
          expect(response).to have_http_status(:ok)
          json_response = JSON.parse(response.body)
          expect(json_response).to include_json(
            label: OQXB_LABEL,
            accession: OQXB_ACCESSION,
            description: OQXB_DESCRIPTION,
            synonyms: [],
            publications: [
              OQXB_PUBLICATION,
            ],
            geneFamily: [
              {
                label: OQXB_GENE_FAMILY_LABEL,
                description: OQXB_GENE_FAMILY_DESC,
              },
            ],
            drugClass: {
              label: OQXB_DRUG_CLASS_LABEL,
              description: OQXB_DRUG_CLASS_DESC,
            },
            error: ""
          )
        end
      end

      context "when no matching gene is found" do
        before do
          allow(S3Util).to receive(:s3_select_json).and_return("")
          stub_const("S3_DATABASE_BUCKET", "czid-public-references")
        end

        it "should return an ontology object with an error message if no match is found" do
          get :fetch_ontology, params: { geneName: "ImNotInCard" }
          expect(response.content_type).to include("application/json")
          expect(response).to have_http_status(:ok)

          json_response = JSON.parse(response.body)
          expect(json_response).to include_json(
            error: "No data for imNotInCard." # will try the downcased version if the uppercased version is not found
          )
        end
      end
    end
  end
end
