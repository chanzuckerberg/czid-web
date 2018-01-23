S3_CLIENT = Aws::S3::Client.new
S3_PRESIGNER = Aws::S3::Presigner.new(client: S3_CLIENT) # auth from the env
SAMPLES_BUCKET_NAME = ENV['SAMPLES_BUCKET_NAME']
SAMPLE_DOWNLOAD_EXPIRATION = 3600 # seconds
