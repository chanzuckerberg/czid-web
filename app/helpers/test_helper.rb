require 'open3'
require 'csv'

module TestHelper
  TEST_RESULT_FOLDER = %w[
    unmapped1.fq
    trimmomatic1.fq
    priceseq1.fa
    dedup1.fa
    lzw1.fa
    bowtie2_1.fa
    subsampled_1.fa
    gsnap_filter_1.fa
  ].map do |file_name|
    {
      key: "path/to/#{file_name}",
      display_name: file_name,
      url: "test url",
      size: "test size"
    }
  end
end
