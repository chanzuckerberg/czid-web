begin
  path = "app/lib/location_name_aliases.json"
  LOCATION_NAME_ALIASES = if File.file?(path)
                            JSON.parse(File.read(path))
                          else
                            {}.freeze
                          end
rescue SystemCallError, JSON::ParserError => err
  Rails.logger.error("Couldn't load location name aliases. #{err.message}")
  raise
end
