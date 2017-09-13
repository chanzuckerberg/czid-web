module IdSeqPipeline
  AWS_ACCESS_KEY_ID = ENV['AWS_ACCESS_KEY_ID']
  AWS_SECRET_ACCESS_KEY = ENV['AWS_SECRET_ACCESS_KEY']
  AWS_DEFAULT_REGION = ENV['AWS_DEFAULT_REGION']
  S3_SCRIPT_LOC= 's3://czbiohub-infectious-disease/bin/pipeline.py'
  BASE_COMMAND = "export AWS_ACCESS_KEY_ID=#{AWS_ACCESS_KEY_ID}" +
                 " AWS_SECRET_ACCESS_KEY=#{AWS_SECRET_ACCESS_KEY}" +
                 " AWS_DEFAULT_REGION=#{AWS_DEFAULT_REGION}; "
  def self.pipeline_command(input_s3_dir, output_s3_dir, db_sample_id)
    script_name = File.basename(S3_SCRIPT_LOC)
    batch_command = "aws s3 cp #{S3_SCRIPT_LOC} .; chmod 755 #{script_name}; " +
                    "INPUT_BUCKET=#{input_s3_dir} OUTPUT_BUCKET=#{output_s3_dir} " +
                    "DB_SAMPLE_ID=#{db_sample_id} ./#{script_name}"
    command = BASE_COMMAND
    command += "aegea batch submit --command=\"#{batch_command}\" "
    command += " --storage /mnt=1500 --ecr-image idseq --memory 64000"
    command
  end
end
