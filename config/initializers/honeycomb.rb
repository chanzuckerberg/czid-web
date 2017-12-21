
if ENV["IDSEQ_HONEYCOMB_WRITE_KEY"] && ENV["IDSEQ_HONEYCOMB_DATA_SET"] && ENV["IDSEQ_HONEYCOMB_DB_DATA_SET"]
  HoneycombRails.configure do |conf|
    conf.writekey = ENV["IDSEQ_HONEYCOMB_WRITE_KEY"]
    conf.dataset = ENV["IDSEQ_HONEYCOMB_DATA_SET"]
    conf.db_dataset = ENV["IDSEQ_HONEYCOMB_DB_DATA_SET"]
  end
end
