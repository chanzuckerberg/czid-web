# There are three keys to backfilling safely: batching, throttling, and running it outside a transaction.
class BackfillTaxonCountDecimalColumns < ActiveRecord::Migration[6.1]
  disable_ddl_transaction!

  def up
    TaxonCount.in_batches do |relation|
      relation.update_all("percent_identity_decimal = percent_identity, alignment_length_decimal = alignment_length, rpm_decimal = rpm")
      sleep(0.01) # throttle
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end
