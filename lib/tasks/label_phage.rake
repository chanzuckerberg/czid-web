task label_phage: :environment do
  # We label as 'phage' all of the prokaryotic (bacterial and archaeal) virus families
  # listed here: https://en.wikipedia.org/wiki/Bacteriophage
  TaxonLineage.connection.execute(
    "INSERT INTO taxon_lineages(is_phage)
     SELECT
       IF(taxon_lineages.family_name IN ('Myoviridae', 'Siphoviridae', 'Podoviridae', 'Lipothrixviridae',
                                         'Rudiviridae', 'Ampullaviridae', 'Bicaudaviridae', 'Clavaviridae',
                                         'Corticoviridae', 'Cystoviridae', 'Fuselloviridae', 'Globuloviridae',
                                         'Guttaviridae', 'Inoviridae', 'Leviviridae', 'Microviridae', 'Plasmaviridae', 'Tectiviridae'),
          1,
          0)
     FROM taxon_lineages"
  )
end
