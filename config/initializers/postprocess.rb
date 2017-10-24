module IdSeqPostprocess
  S3_SCRIPT_LOC = ENV['IDSEQ_POSTPROCESS_S3_SCRIPT_LOC'] || 's3://czbiohub-infectious-disease/bin/postprocess.py'
end
