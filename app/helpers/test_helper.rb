require 'open3'
require 'csv'

module TestHelper
  # Consider this a fixture for tests. Needs to integrate with dag_json for public_sample_run_stage.
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
      key: "samples/theProjectId/theSampleId/results/1.0/#{file_name}",
      display_name: file_name,
      url: "test url",
      size: "test size"
    }
  end
end
