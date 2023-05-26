FactoryBot.define do
  factory :local_web_input_file, class: InputFile do
    sequence(:name) { |n| "file.#{n}.fastq.gz" }
    sequence(:source) { |n| "file.#{n}.fastq.gz" }
    source_type { "local" }
    upload_client { "web" }
    file_type { InputFile::FILE_TYPE_FASTQ }
  end

  factory :local_web_reference_sequence_input_file, class: InputFile do
    sequence(:name) { |_n| "file.fasta.gz" }
    sequence(:source) { |_n| "file.fasta.gz" }
    source_type { "local" }
    upload_client { "web" }
    file_type { InputFile::FILE_TYPE_REFERENCE_SEQUENCE }
  end

  factory :local_web_primer_bed_input_file, class: InputFile do
    sequence(:name) { |_n| "file.bed.gz" }
    sequence(:source) { |_n| "file.bed.gz" }
    source_type { "local" }
    upload_client { "web" }
    file_type { InputFile::FILE_TYPE_PRIMER_BED }
  end
end
