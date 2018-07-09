task rename_job_stat_names: :environment do
  mapping = { "run_star" => "star_out",
              "run_priceseqfilter" => "priceseq_out",
              "run_cdhitdup" => "cdhitdup_out",
              "run_lzw" => "lzw_out",
              "run_bowtie2" => "bowtie2_out",
              "run_gsnap_filter" => "gsnap_filter_out" }

  JobStat.all.each do |js|
    if mapping[js.task]
      js.update(task: mapping[js.task])
    end
  end
end
