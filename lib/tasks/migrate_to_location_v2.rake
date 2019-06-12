# MANUAL TASK ONLY. Don't invoke this in code. Adapt as needed.
# This task is for migrating location_v1 Metadata (plain text only) to location_v1 Metadata and Location objects (new objects to represent rich location information).

task migrate_to_location_v2: :environment do
  key_v2 = "collection_location_v2"
  log = ["Results below. Please correct incorrect matches manually:"]
  geosearch_cache = {}

  Metadatum.where(key: "collection_location").each do |location_v1|
    sample = location_v1.sample
    if sample
      location_v2 = location_v1.sample.metadata.find_by(key: key_v2)
      unless location_v2
        # Make the new Metadatum entry
        new_datum = Metadatum.new(metadata_field: MetadataField.find_by(name: key_v2), key: key_v2, sample: sample)

        # Sub _ to , for some coordinates
        location_v1_name = location_v1.string_validated_value.gsub(/_/, ",")
        location_v2_value = location_v1_name
        if geosearch_cache.key?(location_v1_name)
          location_v2_value = geosearch_cache[location_v1_name]
        else
          # Do a geosearch for the user input
          success, resp = Location.geosearch(location_v1_name)
          unless success
            log << "Geosearch failed at Sample \##{sample.id}: #{location_v1_name}. Check API limits. Stopping now."
            break
          end

          if resp[0]
            # Find or create a Location entry
            resp = LocationHelper.adapt_location_iq_response(resp[0])
            location = Location.find_by(name: resp[:name]) || Location.new_from_params(resp)
            location.save!
            location_v2_value = location
          end
          geosearch_cache[location_v1_name] = location_v2_value
        end

        # Set the location_v2 value
        if location_v2_value.is_a?(Location)
          new_datum.location = location_v2_value
          log << "Sample \##{sample.id}: Matched \"#{location_v1_name}\" => \"#{location_v2_value.name}\""
          if sample.host_genome_name == "Human"
            log << "^ Human sample. Please correct specificity if needed."
          end
        else
          new_datum.string_validated_value = location_v2_value
          log << "Sample \##{sample.id}: No results. Set to plain text: #{location_v2_value}"
        end
        new_datum.save!(validate: false)
      end
    end
  end
  puts log.join("\n")
end
