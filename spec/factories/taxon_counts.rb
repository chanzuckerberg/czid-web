FactoryBot.define do
  factory :taxon_count, class: TaxonCount do
    transient do
      # The taxon name for the taxon count entry.
      # Will be loaded or created using species (taxon_lineages) factory.
      taxon_name { nil }
      # NT or NR counts. NT will be used if defined. Otherwise, will use NR value.
      # Count type will be filled automaticlaly.
      nt { nil }
      nr { nil }
    end

    initialize_with do
      if taxon_name
        # If taxon name is passed, the taxa must exist
        taxon_lineage = TaxonLineage.find_by!(tax_name: taxon_name)
        # Unable to edit the original hash for some reason
        new(**attributes.dup.merge(tax_id: taxon_lineage.taxid,
                                   name: taxon_lineage.tax_name,
                                   genus_taxid: taxon_lineage.genus_taxid,
                                   superkingdom_taxid: taxon_lineage.superkingdom_taxid))

      else
        new(attributes)
      end
    end

    tax_level { 1 }
    count { nt || nr || 1 }
    count_type { nt ? "NT" : "NR" }
    percent_identity { 95.65 }
    alignment_length { 149.75 }
    e_value { 1.31 }
    rpm { 100 }
  end
end
