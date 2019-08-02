DEFAULT_S3_REGION = "us-west-2".freeze

require "aws-sdk-s3"

module S3Util
  def s3_select_json(bucket, key, expression)
    s3_select_client = Aws::S3::Client.new(region: DEFAULT_S3_REGION)
    s3_select_params = {
      bucket: bucket,
      key: key,
      expression_type: "SQL",
      expression: expression,
      input_serialization: {
        json: {
          type: "DOCUMENT",
        },
      },
      output_serialization: {
        json: {
          record_delimiter: ",",
        },
      },
    }

    entry = []
    begin
      s3_select_client.select_object_content(s3_select_params) do |stream|
        stream.on_records_event do |event|
          entry.push(event.payload.read)
        end
      end
    rescue Aws::S3::Errors => e
      Rails.logger.error("Error retrieving entry #{expression} from #{bucket}/#{key} from s3")
      Rails.logger.error(e.message)
      return []
    end
    return entry
  end
  module_function :s3_select_json
end
