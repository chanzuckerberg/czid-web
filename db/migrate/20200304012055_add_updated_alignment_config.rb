class AddUpdatedAlignmentConfig < ActiveRecord::Migration[5.1]
  NEW_DATE = "2020-02-10".freeze

  def up
    unless AlignmentConfig.find_by(name: NEW_DATE)
      ENV["NCBI_DATE"] = NEW_DATE
      ENV["LINEAGE_VERSION"] = (TaxonLineage.maximum('version_end') || 0 + 1).to_s

      Rails.application.load_tasks
      Rake::Task['create_alignment_config'].invoke
    end
  end

  def down
    exists = AlignmentConfig.find_by(name: NEW_DATE)
    if exists
      exists.delete
    end
  end
end
