FactoryBot.define do
  factory :taxon_byterange do
    taxid { taxid }
    hit_type { hit_type }
    first_byte { first_byte }
    last_byte { last_byte }
    pipeline_run_id { pipeline_run_id }
  end
end
