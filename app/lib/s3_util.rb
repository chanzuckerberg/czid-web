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

  def self.get_s3_range(s3_path, first_byte, last_byte)
    if first_byte.nil? || last_byte.nil?
      LogUtil.log_error("Invalid byte range for S3 file", s3_path: s3_path, first_byte: first_byte, last_byte: last_byte)
      return nil
    end

    bucket, key = parse_s3_path(s3_path)
    byterange = "bytes=#{first_byte}-#{last_byte}"
    begin
      resp = AwsClient[:s3].get_object(bucket: bucket, key: key, range: byterange)
      return resp.body.read
    rescue StandardError => e
      LogUtil.log_error(
        "Error retrieving byte range from S3 file",
        exception: e
      )
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

  def self.latest_multipart_upload(bucket, key)
    resp = AwsClient[:s3].list_multipart_uploads(
      bucket: bucket,
      prefix: key,
      max_uploads: 1
    )
    resp.uploads.map(&:upload_id).first
  end

  def self.delete_s3_prefix(s3_prefix)
    bucket, prefix = parse_s3_path(s3_prefix)
    pages = AwsClient[:s3].list_objects_v2({
                                             bucket: bucket,
                                             prefix: prefix,
                                           })
    pages.each do |resp|
      objects = resp[:contents].map { |object| { key: object[:key] } }
      next if objects.blank?

      AwsClient[:s3].delete_objects({ bucket: bucket, delete: { objects: objects } })
    end
  end
end
