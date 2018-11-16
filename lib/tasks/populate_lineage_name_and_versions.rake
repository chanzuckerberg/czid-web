task populate_lineage_name_and_versions: :environment do
  # For each lineage entry, find the first positive tax level (species->genus->...)
  # and set the corresponding name.
  puts "Updating lineage names..."
  TaxonLineage.all.each do |lin|
    (1..8).each do |level_int|
      level_str = TaxonCount::LEVEL_2_NAME[level_int]
      if lin["#{level_str}_taxid"] > 0
        new_name = lin["#{level_str}_name"]
        lin.update(name: new_name)
      end
    end
  end

  return

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
