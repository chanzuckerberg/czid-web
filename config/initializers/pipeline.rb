module IdSeqPipeline
  S3_SCRIPT_LOC = ENV['IDSEQ_S3_SCRIPT_LOC'] || "s3://czbiohub-infectious-disease/bin/#{Rails.env}/pipeline.py" # TO BE DEPRECATED
  S3_POSTPROCESS_SCRIPT_LOC = ENV['IDSEQ_POSTPROCESS_S3_SCRIPT_LOC'] || "s3://czbiohub-infectious-disease/bin/#{Rails.env}/postprocess.py"
  S3_HOST_FILTER_SCRIPT_LOC = ENV['IDSEQ_HOST_FILTER_S3_SCRIPT_LOC'] || "s3://czbiohub-infectious-disease/bin/#{Rails.env}/host_filtering.py"
  S3_ALIGNMENT_SCRIPT_LOC = ENV['IDSEQ_ALIGNMENT_S3_SCRIPT_LOC'] || "s3://czbiohub-infectious-disease/bin/#{Rails.env}/non_host_alignment.py"
  S3_COMMON_SCRIPT_LOC = ENV['IDSEQ_COMMON_S3_SCRIPT_LOC'] || "s3://czbiohub-infectious-disease/bin/#{Rails.env}/common.py"
end
