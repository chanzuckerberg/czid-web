FactoryBot.define do
  factory :taxon_count, class: TaxonCount do
    transient do
      taxon_name { nil }
      nt { nil }
      nr { nil }
    end

    initialize_with {
      if taxon_name
        taxon_lineage = TaxonLineage.find_by(tax_name: taxon_name)
        if !taxon_lineage
          taxon_lineage = create(:species, {tax_name: taxon_name})
        end
        # Unable to edit the original hash for some reason
        new(**attributes.dup.merge({
          tax_id: taxon_lineage.id,
          name: taxon_lineage.name
        }))
      else
        new(attributes)
      end
    }

    tax_level { 1 }
    count { nt || nr || 1 }
    count_type { nt ? "NT" : "NR" }
  end
end
