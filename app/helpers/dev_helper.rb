module TestHelper
  def _alignment_cost_per_million_reads(month_starting, ec2_cost)
    # Computes the average cost per million reads of gsnap/rapsearch alignment servers over the course of 1 month.
    # ec2_cost should be the cost (in $) of i3.16xlarge instances (=gsnap/rapsearch) for the month, as found in the AWS account.
    # Usage example:
    #   month_starting = "2018-08-01"
    #   ec2_cost = 1000
    # Caveats:
    #  Function works only starting in August because prior runs don't have JobStat.where(task: "subsampled_out")
    #  Functions assumes all pipeline_runs are complete.
    #  Function does not take into account read length.
    start_date = month_starting.to_date
    end_date = start_date + 1.month
    # exclude lazy runs
    runs_doing_alignment = []
    runs_before_end = PipelineRun.where("created_at < ?", end_date).order(:created_at).group_by(&:sample_id)
    runs_before_end.each do |_sample_id, pr_array|
      previous_pr = nil
      pr_array.each_with_index do |pr, idx|
        needed_alignment = (idx.zero? || pr.pipeline_version != previous_pr.pipeline_version)
        is_in_range = (pr.created_at > start_date)
        if is_in_range && needed_alignment
          runs_doing_alignment << pr.id
        end
        previous_pr = pr
      end
    end
    # count reads
    reads = JobStat.where(pipeline_run_id: runs_doing_alignment).where(task: "subsampled_out").pluck("reads_after").sum
    # return normalized cost
    ec2_cost / (reads.to_f / 1e6)
  end
end
