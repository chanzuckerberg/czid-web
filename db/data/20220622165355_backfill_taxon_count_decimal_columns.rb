# frozen_string_literal: true

class BackfillTaxonCountDecimalColumns < ActiveRecord::Migration[6.1]
  def up
    TaxonCount.connection.execute("
      UPDATE taxon_counts
      SET percent_identity_decimal = percent_identity
    ")
    TaxonCount.connection.execute("
      UPDATE taxon_counts
      SET alignment_length_decimal = alignment_length
    ")
    TaxonCount.connection.execute("
      UPDATE taxon_counts
      SET rpm_decimal = rpm
    ")
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
