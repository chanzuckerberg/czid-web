class AddS3TaxonBlacklistPathToAlignmentConfig < ActiveRecord::Migration[5.1]
  def change
    # See also DEFAULT_BLACKLIST_S3 in idseq-dag
    add_column :alignment_configs, :s3_taxon_blacklist_path, :string, null: false, default: 's3://idseq-database/taxonomy/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/taxon_blacklist.txt'
  end
end
