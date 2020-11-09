require "rails_helper"

RSpec.describe S3Util do
  let(:fake_database_bucket) { "fake-database-bucket" }
  let(:ontology_file_key) { "amr/ontology/2020-01-01/aro.json" }
  let(:test_expression) { "SELECT * FROM S3Object[*].NorA LIMIT 1" }
  let(:sample_gene_response) { "{\"label\":\"norA\",\"accession\":\"3000391\",\"description\":\"NorA is an AMR gene.\",\"synonyms\":[],\"publications\":[\"Publication 1. (PMID 31415926)\",\"Publication 2. (PMID 12345678)\",\"Publication 3. (PMID 98765432)\"],\"geneFamily\":[{\"label\":\"gene family label\",\"description\":\"gene family description.\"}],\"drugClass\":{\"label\":\"Drug class\",\"description\":\"Drug class description.\"},\"genbankAccession\":\"HE123456\"}," }
  let(:successful_stream_response) do
    [
      {
        message_type: 'event',
        event_type: 'records',
        payload: StringIO.new(sample_gene_response),
      },
    ].each
  end
  let(:unsuccessful_stream_response) do
    [
      {
        message_type: 'error',
        error_code: 'InternalError',
        error_message: 'We encountered an internal error. Please try again.',
      },
    ].each
  end

  before do
    @mock_aws_clients = {
      s3: Aws::S3::Client.new(stub_responses: true),
    }
    allow(AwsClient).to receive(:[]) { |client|
      @mock_aws_clients[client]
    }
  end

  describe "#s3_select_json" do
    # this test uses the example of getting information on a single gene
    # from a JSON file with information about many genes
    it "should return a single string on success" do
      @mock_aws_clients[:s3].stub_responses(:select_object_content, { payload: successful_stream_response })
      entry = S3Util.s3_select_json(fake_database_bucket, ontology_file_key, test_expression)
      expect(entry).to be_instance_of(String)
      expect(entry).to eq(sample_gene_response)
    end

    # On error (like a gene name not found in the json file), return a blank string.
    it "handles errors from S3" do
      @mock_aws_clients[:s3].stub_responses(:select_object_content, { payload: unsuccessful_stream_response })
      expect { S3Util.s3_select_json(fake_database_bucket, ontology_file_key, test_expression) }.not_to raise_error
      entry = S3Util.s3_select_json(fake_database_bucket, ontology_file_key, test_expression)
      expect(entry).to be_instance_of(String)
      expect(entry.blank?).to be_truthy
    end
  end
end
