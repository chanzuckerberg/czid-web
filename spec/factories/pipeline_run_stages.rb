FactoryBot.define do
  factory :pipeline_run_stage, class: PipelineRunStage do
    # Should be one of the four stages:
    # Host Filtering, GSNAPLgcRAPSEARCH alignment,
    # Post Processing, Experimental
    # TODO: (gdingle): rename to stage_number. See https://jira.czi.team/browse/IDSEQ-1912.
    step_number { 1 }
    name { PipelineRunStage::HOST_FILTERING_STAGE_NAME }
    job_status { PipelineRunStage::STATUS_SUCCEEDED }
    job_command_func { "command" }
    # NOTE: in the model dag_json is actually stored as a string
    dag_json do
      {
        output_dir_s3: "s3:gc/someBucket/samples/theProjectId/theSampleId/results",
        targets: {
          fastqs: ["input.fastq"],
          star_out: ["unmapped1.fq"],
          trimmomatic_out: ["trimmomatic1.fq"],
          priceseq_out: ["priceseq1.fa"],
          cdhitdup_out: ["dedup1.fa"],
          lzw_out: ["lzw1.fa"],
          bowtie2_out: ["bowtie2_1.fa"],
          subsampled_out: ["subsampled_1.fa"],
          gsnap_filter_out: ["gsnap_filter_1.fa"],
        },
        given_targets: {
          fastqs: {
            s3_dir: "s3:gc/someBucket/samples/theProjectId/theSampleId/fastqs",
          },
        },
      }
    end
  end
end
