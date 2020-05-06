module S3Helper
  def parse_s3_path(s3_path)
    uri_parts = s3_path.split("/", 4)
    bucket = uri_parts[2]
    key = uri_parts[3]
    return bucket, key
  end
end
