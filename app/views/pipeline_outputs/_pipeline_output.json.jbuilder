json.extract! pipeline_output, :id, :sample_id, :total_reads, :remaining_reads, :created_at, :updated_at
json.url pipeline_output_url(pipeline_output, format: :json)
