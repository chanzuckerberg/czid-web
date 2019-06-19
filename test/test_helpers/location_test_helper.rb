module LocationTestHelper
  API_GEOSEARCH_RESPONSE = [
    {
      "place_id" => "89640023",
      "osm_type" => "way",
      "osm_id" => "34324395",
      "lat" => 37.76,
      # LocationIQ uses 'lon'
      "lon" => -122.45,
      "display_name" => "University of California, San Francisco, Parnassus Avenue, Inner Sunset, San Francisco, San Francisco City and County, California, 94131, USA",
      "address" => {
        "university" => "University of California, San Francisco",
        "city" => "San Francisco",
        "county" => "San Francisco City and County",
        "state" => "California",
        "country" => "USA",
        "country_code" => "us"
      }
    }
  ].freeze
  API_OSM_ID_SEARCH_RESPONSE = API_GEOSEARCH_RESPONSE[0].freeze

  FORMATTED_GEOSEARCH_RESPONSE = [
    {
      "name" => "University of California, San Francisco, San Francisco, San Francisco City and County, California, USA",
      "geo_level" => "city",
      "country_name" => "USA",
      "state_name" => "California",
      "subdivision_name" => "San Francisco City and County",
      "city_name" => "San Francisco",
      "lat" => 37.76,
      "lng" => -122.45,
      "country_code" => "us",
      "osm_id" => 34_324_395,
      "osm_type" => "way",
      "locationiq_id" => 89_640_023
    }
  ].freeze
  API_GEOSEARCH_CALIFORNIA_RESPONSE = [
    {
      "place_id" => "214330370",
      "osm_type" => "relation",
      "osm_id" => "165475",
      "lat" => 36.70,
      # LocationIQ uses 'lon'
      "lon" => -118.76,
      "display_name" => "California, USA",
      "address" => {
        "state" => "California",
        "country" => "USA",
        "country_code" => "us"
      }
    }
  ].freeze
  API_GEOSEARCH_SF_COUNTY_RESPONSE = [
    {
      "place_id" => "214379825",
      "osm_type" => "relation",
      "osm_id" => "396487",
      "lat" => 37.76,
      # LocationIQ uses 'lon'
      "lon" => -122.46,
      "display_name" => "San Francisco City and County, California, USA",
      "address" => {
        "county" => "San Francisco City and County",
        "state" => "California",
        "country" => "USA",
        "country_code" => "us"
      }
    }
  ].freeze
  API_GEOSEARCH_DHAKA_RESPONSE = [
    {
      "place_id" => "46003496",
      "osm_type" => "node",
      "osm_id" => "3442474911",
      "lat" => 23.76,
      # LocationIQ uses 'lon'
      "lon" => 90.38,
      "display_name" => "Dhaka, Dhaka Division, 12, Bangladesh",
      "address" => {
        "city" => "Dhaka",
        "state" => "Dhaka Division",
        "country" => "Bangladesh",
        "country_code" => "bd"
      }
    }
  ].freeze
  FORMATTED_GEOSEARCH_DHAKA_RESPONSE = [
    {
      "name" => "Dhaka, Dhaka Division, Bangladesh",
      "geo_level" => "city",
      "country_name" => "Bangladesh",
      "state_name" => "Dhaka Division",
      "subdivision_name" => "",
      "city_name" => "Dhaka",
      "lat" => 23.76,
      "lng" => 90.38,
      "country_code" => "bd",
      "osm_id" => 3_442_474_911,
      "osm_type" => "node",
      "locationiq_id" => 46_003_496
    }
  ].freeze
end
