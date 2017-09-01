# Module to connect to Airflow webserver
module Airflow
  CONFIG = YAML.load_file(Rails.root.join("config/airflow.yml"))[Rails.env]
  BASEURL = "#{CONFIG['protocol']}://#{CONFIG['host']}:#{CONFIG['port']}#{CONFIG['uri']}"
  def self.get_request_url(config_hash)
    conf_json_str = config_hash.to_json
    query_hash = { api: CONFIG['dag_api'], dag_id: CONFIG['dag_id'], conf: conf_json_str}
    query_string = query_hash.to_query

    "#{BASEURL}?#{query_string}"
  end
end
