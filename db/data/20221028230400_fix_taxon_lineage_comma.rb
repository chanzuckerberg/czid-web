# frozen_string_literal: true

class FixTaxonLineageComma < ActiveRecord::Migration[6.1]
  def up
    TaxonLineage.where("tax_name LIKE :prefix", prefix: "\"%").each do | lineage_record | 
      if lineage_record.species_taxid == -100 && lineage_record.genus_common_name.ends_with?("\"")
        prefix = lineage_record.genus_name.delete_prefix("\"")
        suffix = lineage_record.genus_common_name.delete_suffix("\"")
        fixed_name = "#{prefix},#{suffix}"
        lineage_record.update(
          tax_name: fixed_name,
          genus_name: fixed_name, 
          genus_common_name: "",
        )
      elsif lineage_record.species_common_name.ends_with?("\"")
        prefix = lineage_record.species_name.delete_prefix("\"") 
        suffix = lineage_record.species_common_name.delete_suffix("\"")
        fixed_name = "#{prefix},#{suffix}"
        lineage_record.update(
          tax_name: fixed_name,
          species_name: fixed_name, 
          species_common_name: "",
        )
      end
    end
  end

  def down
    raise ActiveRecord::IrreversibleMigration
  end
end