task find_lineaage_gaps: :environment do
  taxid_with_gap = []
  prev_taxon = nil
  i = 0
  TaxonLineage.order("taxid, started_at, ended_at").each do |taxon|
      if prev_taxon && taxon.taxid == prev_taxon.taxid
          gap = taxon.started_at.to_i - prev_taxon.ended_at.to_i
          if gap > 30 # seconds
              puts "#{taxon.taxid} has #{gap} seconds gap"
              taxid_with_gap.append(taxon.taxid) 
              prev_taxon.ended_at = taxon.started_at - 1.second 
              prev_taxon.save
          end 
      end
      prev_taxon = taxon
      i += 1 
      puts "#{i} rows processed" if i % 100 == 0
  end
end
