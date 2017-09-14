json.extract! sample, :id, :name, :status, :created_at, :updated_at
json.url sample_url(sample, format: :json)
json.input_files(sample.input_files) do |input_file|
  json.extract! input_file, :name, :presigned_url
end
