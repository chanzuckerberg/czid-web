task reload_workflow_runs_cached_results: :environment do
  WorkflowRun.where(status: "SUCCEEDED").each do |wf|
    wf.send(:load_cached_results)
  end
end
