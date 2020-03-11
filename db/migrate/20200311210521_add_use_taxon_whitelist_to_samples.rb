class AddUseTaxonWhitelistToSamples < ActiveRecord::Migration[5.1]
  def change
    add_column :samples, :use_taxon_whitelist, :boolean, default: false, null: false, comment: "If true, sample processing will filter for a whitelist of taxons."
  end
end
