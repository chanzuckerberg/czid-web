FactoryBot.define do
  factory :local_web_input_file, class: InputFile do
    sequence(:name) { |n| "file.#{n}.fastq.gz" }
    sequence(:source) { |n| "file.#{n}.fastq.gz" }
    source_type { "local" }
    upload_client { "web" }
    file_type { "fastq" }
  end
end
