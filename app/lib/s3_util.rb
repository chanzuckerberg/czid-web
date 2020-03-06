require "aws-sdk-s3"

module S3Util
  # select a particular part of a JSON file using Amazon S3 Select SQL syntax
  def self.s3_select_json(bucket, key, expression)
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
      S3_CLIENT.select_object_content(s3_select_params) do |stream|
        stream.on_records_event do |event|
          entry.push(event.payload.read)
        end
      end
    rescue Aws::S3::Errors => e
      Rails.logger.error("Error retrieving entry #{expression} from #{bucket}/#{key} from s3")
      Rails.logger.error(e.message)
      return ""
    end
    return entry.join
  end

  def self.upload_to_s3(bucket, key, content)
    S3_CLIENT.put_object(bucket: bucket,
                         key: key,
                         body: content)
  end
end
