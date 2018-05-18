task get_recent_s3_keys: :environment do
  ### Gives the S3 keys of data folder for samples created after a certain datetime.
  puts "Datetime right now: #{Time.now.utc}"
  puts "Enter a datetime: "
  threshold_datetime = STDIN.gets.strip
  s3_sample_folders = Sample.where("created_at >= ?", threshold_datetime).map { |s| "s3://#{SAMPLES_BUCKET_NAME}/#{s.sample_path}" }
  puts "Samples created on or after #{threshold_datetime}:"
  puts s3_sample_folders.join("\n")
end
