task populate_lineage_name_and_versions: :environment do
  puts "Updating lineage names..."
  # Starting from species, go up through the levels and set the tax_name if you
  # have a positive taxid on that level.
  # TaxonLineage.tax_level is a function call so this goes 1,2,3,.. with the same positive/negative check for the sake of keeping the update queries to a minimum.
  (1..8).each do |level_int|
    level_str = TaxonCount::LEVEL_2_NAME[level_int]
    TaxonLineage.where("#{level_str}_taxid > 0").where(tax_name: nil).update_all("tax_name=#{level_str}_name")
  end

  # Set started_at and ended_at. distinct.pluck is really fast.
  start_vals = TaxonLineage.distinct.pluck(:started_at).sort
  end_vals = TaxonLineage.distinct.pluck(:ended_at).sort
  all_vals = (start_vals + end_vals).uniq.sort
  puts "All date values: #{all_vals}"

  # all_vals will look something like: [2000-01-01 00:00:00, 2018-04-18 20:58:48, 2018-07-20 20:04:01, 3000-01-01 00:00:00]. There are 3 'version nums' between 4
  # vals. The exact times vary a little in dev/staging/prod.

  all_vals.each_with_index do |t, i|
    puts "Updating all version_start..."
    TaxonLineage.where(started_at: t).update_all(version_start: i) # rubocop:disable Rails/SkipsModelValidations

    # Do i-1 for version_end to deal with overlap / make the ranges inclusive
    # so that version_end is the last valid version num. Ex: first ones will
    # start and end at version=0 probably.
    # If a lineage doesn't get updated during an index update, version_end gets += 1.
    puts "Updating all version_end..."
    TaxonLineage.where(ended_at: t).update_all(version_end: i - 1) # rubocop:disable Rails/SkipsModelValidations
  end

  puts "All done!"
end
