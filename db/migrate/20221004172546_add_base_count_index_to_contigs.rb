class AddBaseCountIndexToContigs < ActiveRecord::Migration[6.1]
  def change
    # Only add the base_count index if it doesn't already exist on Contigs.
    # The original version of the AddBasesColumnsToTaxonCountsAndContigs migration
    # also added the join index on [:pipeline_run_id, :base_count],
    # so we need to check if it already exists.
    if !ActiveRecord::Base.connection.index_exists? :contigs, [:pipeline_run_id, :base_count]
      add_index :contigs, [:pipeline_run_id, :base_count]
    end
  end
end
