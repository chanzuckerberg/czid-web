begin
  path = "app/lib/location_name_aliases.json"
  LOCATION_NAME_ALIASES = JSON.parse(File.read(path))
rescue StandardError => error
  Rails.logger.error("Couldn't load location name aliases.")
  LOCATION_NAME_ALIASES = {}
end
