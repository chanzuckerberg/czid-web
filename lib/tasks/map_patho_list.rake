# Map the pathogen list to taxids
# Run with rake map_patho_list['patho_list.txt']

task :map_patho_list, [:patho_file] => :environment do |_t, args|
  File.open(args[:patho_file]).each do |taxon_name|
    taxon_name.chomp!
    tl = TaxonLineage.find_by(species_name: taxon_name) || TaxonLineage.find_by(genus_name: taxon_name)
    taxid = tl ? tl.taxid : 'Not Found'
    print "#{taxon_name}\t#{taxid}\n"
  end
end
