class CreateAlignmentConfigs < ActiveRecord::Migration[5.1]
  def up
    create_table :alignment_configs do |t|
      t.string :name, unique: true
      t.string :index_dir_suffix
      t.text   :s3_nt_db_path
      t.text   :s3_nt_loc_db_path
      t.text   :s3_nr_db_path
      t.text   :s3_nr_loc_db_path
      t.text   :s3_lineage_path
      t.text   :s3_accession2taxid_path
      t.text   :s3_deuterostome_db_path
      t.timestamps
    end

    ac1 = AlignmentConfig.new(
      name: "2018-02-15",
      s3_nt_db_path: "s3://idseq-database/20170824/blast_db/nt",
      s3_nt_loc_db_path: "s3://idseq-database/20170824/blast_db/nt_loc.db",
      s3_nr_db_path: "s3://idseq-database/20170824/blast_db/nr",
      s3_nr_loc_db_path: "s3://idseq-database/20170824/blast_db/nr_loc.db",
      s3_lineage_path: "s3://idseq-database/taxonomy/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/taxid-lineages.db",
      s3_accession2taxid_path: "s3://idseq-database/alignment_data/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/accession2taxid.db",
      s3_deuterostome_db_path: "s3://idseq-database/taxonomy/2018-02-15-utc-1518652800-unixtime__2018-02-15-utc-1518652800-unixtime/deuterostome_taxids.txt"
    )
    ac1.save!

    ac2 = AlignmentConfig.new(
      name: "2018-04-01",
      index_dir_suffix: "2018-04-01",
      s3_nt_db_path: "s3://idseq-database/alignment_data/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/nt",
      s3_nt_loc_db_path: "s3://idseq-database/alignment_data/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/nt_loc.db",
      s3_nr_db_path: "s3://idseq-database/alignment_data/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/nr",
      s3_nr_loc_db_path: "s3://idseq-database/alignment_data/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/nr_loc.db",
      s3_lineage_path: "s3://idseq-database/taxonomy/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/taxid-lineages.db",
      s3_accession2taxid_path: "s3://idseq-database/alignment_data/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/accession2taxid.db",
      s3_deuterostome_db_path: "s3://idseq-database/taxonomy/2018-04-01-utc-1522569777-unixtime__2018-04-04-utc-1522862260-unixtime/deuterostome_taxids.txt"
    )
    ac2.save!

    add_column :pipeline_runs, :alignment_config_id, :bigint
    add_column :samples, :alignment_config_name, :string
    # set the alignment_config_id to the one we are using prior to alignment config
    ActiveRecord::Base.connection.execute("UPDATE pipeline_runs
                                           SET alignment_config_id = #{ac1.id}")
    ActiveRecord::Base.connection.execute("UPDATE samples
                                           SET alignment_config_name = '#{ac1.name}'")
  end

  def down
    drop_table :alignment_configs
    remove_column :pipeline_runs, :alignment_config_id
    remove_column :samples, :alignment_config_name
  end
end
