task fix_lineaage_gaps: :environment do
  prev_taxon = nil
  TaxonLineage.order("taxid, started_at, ended_at").each do |taxon|
    if prev_taxon && taxon.taxid == prev_taxon.taxid
      gap = taxon.started_at.to_i - prev_taxon.ended_at.to_i
      if gap > 30 # seconds
        puts "#{taxon.taxid} has #{gap} seconds gap"
        prev_taxon.ended_at = taxon.started_at
        prev_taxon.save
      end
    end
    prev_taxon = taxon
  end
end
