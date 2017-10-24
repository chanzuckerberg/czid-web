require 'aws-sdk'
module SequenceLocatorsHelper
  # TO DO: check if ENV variables on instances actually have these names
  ENV['AWS_REGION'] ||= 'us-west-2'
  Creds = Aws::Credentials.new(ENV['AWS_ACCESS_KEY'], ENV['AWS_ACCESS_SECRET'])
  Client = Aws::S3::Client.new(region: ENV['AWS_REGION'], credentials: Creds)

  def getTaxidFastaFile(pipeline_output, sequence_locator, taxid)
    uri_parts = sequence_locator.sequence_file_uri.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
    taxon_location = sequence_locator.taxon_sequence_locations.find_by(taxid: taxid)
    Client.get_object(bucket: bucket, key: key, range: "bytes=#{taxon_location.first_byte}-#{taxon_location.last_byte}")
  end
end
