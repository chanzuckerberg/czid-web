class AddBasesColumnsToTaxonCountsAndContigs < ActiveRecord::Migration[6.1]
  def change
    add_column :taxon_counts, :base_count, :integer, comment: "Number of bases aligning to the taxon in the NCBI NR/NT database"
    add_column :taxon_counts, :bpm, :float, comment: "Number of bases aligning to the taxon in the NCBI NR/NT database, per million bases sequenced"

    # Note: this migration previously added a base_count column (and index) to the Contigs table,
    # hence the migration's name; however, we encountered issues with the size/time required for
    # the migration in production, so those changes have been split out into separate migrations.
  
    # To avoid conflicts with local/staging/sandbox environments that have already
    # run the original migration, this migration will retain its original name.
  end
end
