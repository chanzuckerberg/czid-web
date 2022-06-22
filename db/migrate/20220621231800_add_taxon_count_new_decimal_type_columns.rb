class AddTaxonCountNewDecimalTypeColumns < ActiveRecord::Migration[6.1]
  # Step 1 of safe migration to convert a few taxon count float data type columns to decimal data type
  def change
    add_column :taxon_counts, :percent_identity_decimal, :decimal, precision: 9, scale: 2
    add_column :taxon_counts, :alignment_length_decimal, :decimal, precision: 9, scale: 2
    add_column :taxon_counts, :rpm_decimal, :decimal, precision: 9, scale: 2
  end
end
