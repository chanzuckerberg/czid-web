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
      AwsClient[:s3].select_object_content(s3_select_params) do |stream|
        stream.on_records_event do |event|
          entry.push(event.payload.read)
        end
      end
    rescue Aws::S3::Errors::ServiceError => e
      Rails.logger.error("Error retrieving entry #{expression} from #{bucket}/#{key} from s3")
      Rails.logger.error(e.message)
      return ""
    end
    return entry.join
  end

  def self.get_s3_file(s3_path)
    bucket, key = parse_s3_path(s3_path)
    begin
      resp = AwsClient[:s3].get_object(bucket: bucket, key: key)
      return resp.body.read
    rescue StandardError
      return nil
    end
  end

  def self.upload_to_s3(bucket, key, content)
    AwsClient[:s3].put_object(bucket: bucket,
                              key: key,
                              body: content)
  end

  def self.parse_s3_path(s3_path)
    uri_parts = s3_path.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
    return bucket, key
  end

  def self.get_file_size(bucket, key)
    resp = AwsClient[:s3].list_objects_v2(bucket: bucket,
                                          prefix: key,
                                          max_keys: 1)
    if !resp.contents.empty?
      return resp.contents[0].size
    else
      raise "Cannot get file size for #{s3_path}: unable to find file"
    end
  end
end
