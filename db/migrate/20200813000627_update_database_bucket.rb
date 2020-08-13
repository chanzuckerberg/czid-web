class UpdateDatabaseBucket < ActiveRecord::Migration[5.2]
  # This migration changes references from S3 bucket idseq-database -> idseq-public-references to support a move to the idseq-prod account.

  def change_names(old_bucket_name, new_bucket_name)
    name_sub = lambda do |existing_name|
      existing_name.sub(old_bucket_name, new_bucket_name) if existing_name
    end

    # Update values in HostGenomes
    HostGenome.all.each do |hg|
      ["s3_star_index_path", "s3_bowtie2_index_path"].each do |col|
        hg[col] = name_sub.call(hg[col])
      end
      hg.save!
    end

    # Update values in AlignmentConfigs
    cols_to_change = AlignmentConfig.column_names.select { |e| /^s3_.+_path$/ =~ e }
    AlignmentConfig.all.each do |ac|
      cols_to_change.each do |col|
        ac[col] = name_sub.call(ac[col])
      end
      ac.save!
    end
  end

  def up
    change_names("idseq-database", "idseq-public-references")
  end

  def down
    change_names("idseq-public-references", "idseq-database")
  end
end
