# Job to upload input files from basespace file to s3 for a particular sample.
class TransferBasespaceFiles
  @queue = :transfer_basespace_files

  # sample_id is the id of the sample we are uploading files to.
  # basespace_dataset_id is the id of dataset from basespace we are uploading samples from.
  #   A dataset is a basespace concept meaning a collection of one or more related files (such as paired fastq files)
  # basespace_access_token is the access token that authorizes us to download these files
  def self.perform(sample_id, basespace_dataset_id, basespace_access_token)
    Rails.logger.info("Start TransferBasespaceFiles for sample id #{sample_id}")
    sample = Sample.find(sample_id)
    sample.transfer_basespace_files(basespace_dataset_id, basespace_access_token)

    # Revoke the access token, so that it can no longer be used.
    begin
      BasespaceHelper.revoke_access_token(basespace_access_token)
      BasespaceHelper.verify_access_token_revoked(basespace_access_token)
    rescue
      Rails.logger.warn("BasespaceAccessTokenError Failed to revoke access token")
    end
  rescue => e
    Rails.logger.error(e)
  end
end
