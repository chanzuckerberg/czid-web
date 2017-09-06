json.extract! report, :id, :name, :pipeline_output_id, :created_at, :updated_at
json.url report_url(report, format: :json)
