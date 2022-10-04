class AddBaseCountToContigs < ActiveRecord::Migration[6.1]
  def change
    # Only add the base_count column if it doesn't already exist on Contigs.
    # The original version of the AddBasesColumnsToTaxonCountsAndContigs migration
    # also added Contig.base_count, so we need to check if it already exists.
    if !Contig.column_names.include? "base_count"
      add_column :contigs, :base_count, :integer, comment: "Number of bases in the contig"
    end
  end
end
