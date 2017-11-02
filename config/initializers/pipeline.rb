module IdSeqPipeline
  S3_SCRIPT_LOC = ENV['IDSEQ_S3_SCRIPT_LOC'] || "s3://czbiohub-infectious-disease/bin/#{Rails.env}/pipeline.py"
  S3_POSTPROCESS_SCRIPT_LOC = ENV['IDSEQ_POSTPROCESS_S3_SCRIPT_LOC'] || "s3://czbiohub-infectious-disease/bin/#{Rails.env}/postprocess.py"
end
