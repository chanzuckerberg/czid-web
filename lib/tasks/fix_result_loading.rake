require 'open3'
###########################################################################
# Onetime script: Switching from status based results loading to output based result loading
############################################################################
task fix_result_loading: :environment do
  Sample.all.each do |sample|
    puts sample.id
    pr = sample.pipeline_runs.first
    if pr
      pr.check_job_status
      pr.save
    end
  end
end
