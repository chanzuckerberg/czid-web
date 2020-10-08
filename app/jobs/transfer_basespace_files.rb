# Job to upload input files from basespace file to s3 for a particular sample.
class TransferBasespaceFiles
  extend InstrumentedJob

  @queue = :transfer_basespace_files

  # sample_id is the id of the sample we are uploading files to.
  # basespace_dataset_id is the id of dataset from basespace we are uploading samples from.
  #   A dataset is a basespace concept meaning a collection of one or more related files (such as paired fastq files)
  # basespace_access_token is the access token that authorizes us to download these files
  def self.perform(sample_id, basespace_dataset_id, basespace_access_token)
    Rails.logger.info("Start TransferBasespaceFiles for sample id #{sample_id}")
    sample = Sample.find(sample_id)
    sample.transfer_basespace_files(basespace_dataset_id, basespace_access_token)

    # If ALL samples relying on this access token are done transferring files, revoke the access token.
    samples_remaining = Sample.where(basespace_access_token: basespace_access_token, status: Sample::STATUS_CREATED)

    # If multiple samples finish file transfer at exactly the same time, this block of code may be run multiple times.
    if samples_remaining.empty?
      begin
        BasespaceHelper.revoke_access_token(basespace_access_token)
      rescue HttpHelper::HttpError => err
        # If revoke_access_token is called multiple times, it will fail on the subsequent calls. This is okay.
        if err.status_code == 401
          Rails.logger.warn("Revoke access token failed for sample #{sample_id}. Likely called multiple times by samples sharing the same token.")
        else
          raise err
        end
      end

      # This verification call will work even if called multiple times.
      BasespaceHelper.verify_access_token_revoked(basespace_access_token, sample_id)
    end
  rescue StandardError => err
    LogUtil.log_err("Error transferring basespace files for sample #{sample_id}. Reason: #{err}")
    raise err
  end
end
