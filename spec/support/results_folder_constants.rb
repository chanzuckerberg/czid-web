module ResultsFolderConstants
  SFN_RESULTS_FOLDER_UPLOADER_RESPONSE = {
    hostFiltering: {
      name: "Host Filtering",
      stageDescription: "Filter out host reads and conduct quality control.",
      steps: {
        runValidateInput: {
          name: "Run Validate Input",
          stepDescription: "Test step description",
          fileList: [
            {
              displayName: "validate_input_summary.json",
              url: "https://s3.test-url.test/sample/file.file",
              size: "55 Bytes",
              key: "samples/1/2/results/idseq-test-main-1/wdl-2/dag-4.x/validate_input_summary.json",
            },
          ],
          readsAfter: 5204,
        },
        runStar: {
          name: "Run Star",
          stepDescription: "Test step description",
          fileList: [
            {
              displayName: "unmapped1.fastq",
              url: "https://s3.test-url.test/sample/file.file",
              size: "143 KB",
              key: "samples/1/2/results/idseq-test-main-1/wdl-2/dag-4.x/unmapped1.fastq",
            },
          ],
          readsAfter: 826,
        },
        runTrimmomatic: {
          name: "Run Trimmomatic",
          stepDescription: "Test step description",
          fileList: [
            {
              displayName: "trimmomatic1.fastq",
              url: "https://s3.test-url.test/sample/file.file",
              size: "81.1 KB",
              key: "samples/1/2/results/idseq-test-main-1/wdl-2/dag-4.x/trimmomatic1.fastq",
            },
          ],
          readsAfter: 566,
        },
        runPriceSeq: {
          name: "Run Price Seq",
          stepDescription: "Test step description",
          fileList: [
            {
              displayName: "priceseq1.fa",
              url: "https://s3.test-url.test/sample/file.file",
              size: "35.6 KB",
              key: "samples/1/2/results/idseq-test-main-1/wdl-2/dag-4.x/priceseq1.fa",
            },
          ],
          readsAfter: 440,
        },
        runCdHitDup: {
          name: "Run Cd Hit Dup",
          stepDescription: "Test step description",
          fileList: [
            {
              displayName: "dedup1.fa",
              url: "https://s3.test-url.test/sample/file.file",
              size: "35.3 KB",
              key: "samples/1/2/results/idseq-test-main-1/wdl-2/dag-4.x/dedup1.fa",
            },
          ],
          readsAfter: 436,
        },
        runLzw: {
          name: "Run Lzw",
          stepDescription: "Test step description",
          fileList: [
            {
              displayName: "lzw1.fa",
              url: "https://s3.test-url.test/sample/file.file",
              size: "33 KB",
              key: "samples/1/2/results/idseq-test-main-1/wdl-2/dag-4.x/lzw1.fa",
            },
          ],
          readsAfter: 416,
        },
        runBowtie2Bowtie2Out: {
          name: "Run Bowtie2 Bowtie2",
          stepDescription: "Test step description",
          fileList: [
            {
              displayName: "bowtie2_1.fa",
              url: "https://s3.test-url.test/sample/file.file",
              size: "17.3 KB",
              key: "samples/1/2/results/idseq-test-main-1/wdl-2/dag-4.x/bowtie2_1.fa",
            },
          ],
          readsAfter: nil,
        },
        runSubsample: {
          name: "Run Subsample",
          stepDescription: "Test step description",
          fileList: [
            {
              displayName: "subsampled_1.fa",
              url: "https://s3.test-url.test/sample/file.file",
              size: "17.3 KB",
              key: "samples/1/2/results/idseq-test-main-1/wdl-2/dag-4.x/subsampled_1.fa",
            },
          ],
          readsAfter: 218,
        },
        runGsnapFilter: {
          name: "Run Gsnap Filter",
          stepDescription: "Test step description",
          fileList: [
            {
              displayName: "gsnap_filter_1.fa",
              url: "https://s3.test-url.test/sample/file.file",
              size: "17.3 KB",
              key: "samples/1/2/results/idseq-test-main-1/wdl-2/dag-4.x/gsnap_filter_1.fa",
            },
          ],
          readsAfter: 218,
        },
      },
    },
  }.freeze
  SFN_RESULTS_FOLDER_NONOWNER_RESPONSE = lambda {
    response = SFN_RESULTS_FOLDER_UPLOADER_RESPONSE.deep_dup
    response[:hostFiltering][:steps].each do |_step, step_data|
      step_data[:fileList].each do |file|
        file[:url] = nil
      end
    end
    return response
  }.call
end
