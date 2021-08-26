class ChangeAccessionCoverageStatNameToText < ActiveRecord::Migration[6.1]
  def change
    change_column :accession_coverage_stats, :accession_name, :text
  end
end
