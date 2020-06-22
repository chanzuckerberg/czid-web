# Load taxon descriptions
# rake load_taxon_descriptions['s3://idseq-samples-prod/yunfang/taxid2description.json']
# To run an individual taxon: rake load_taxon_descriptions['s3://idseq-developers/omar/taxid2descriptiontest/4.9/taxid2description.json']

desc "Loads taxon descriptions from S3 into database"
task :load_taxon_descriptions, [:taxon_desc_s3_path] => :environment do |_t, args|
  downloaded_json_path = PipelineRun.download_file_with_retries(args[:taxon_desc_s3_path],
                                                                '/app/tmp/taxid2desc',
                                                                3)
  LOAD_CHUNK_SIZE = 200
  json_dict = JSON.parse(File.read(downloaded_json_path)) # UTF-8 encoding is by default
  values_list = []
  date = DateTime.now.in_time_zone
  ActiveRecord::Base.transaction do
    json_dict.each do |taxid, data|
      description = data['description']
      title = data['title'] || ''
      summary = data['summary'] || ''
      datum = [taxid.to_i, data['pageid'].to_i,
               description, title, summary, date, date,].map { |v| ActiveRecord::Base.connection.quote(v) }
      values_list << datum
      if values_list.size >= LOAD_CHUNK_SIZE
        ActiveRecord::Base.connection.execute <<-SQL
          REPLACE INTO taxon_descriptions (taxid, wikipedia_id, description, title, summary, created_at, updated_at) VALUES #{values_list.map { |values| "(#{values.join(',')})" }.join(', ')}
        SQL
        values_list = []
      end
    end
    ActiveRecord::Base.connection.execute <<-SQL
      REPLACE INTO taxon_descriptions (taxid, wikipedia_id, description, title, summary, created_at, updated_at) VALUES #{values_list.map { |values| "(#{values.join(',')})" }.join(', ')}
    SQL
  end
end
