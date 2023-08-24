# Writes CARD and wildcard (variants) version to inputs_json for all historical AMR runs. This will be
# used to display the versions on the sample report page. Previously we were not storing this
# information at all and were hard-coding the CARD version based on the WDL version.
# Writing CARD & wildcard version to inputs_json allows easy updates of the CARD DB via app config.
# See https://czi.atlassian.net/wiki/spaces/SCI/pages/2678292933/WebApp+AMR+V2 for more details on updating CARD.

desc "Writes CARD and wildcard version to all historical AMR runs in the inputs_json field"
task backfill_card_version_amr_workflow_runs: :environment do
  workflow_ids_failed_to_update = []
  # get all AMR workflow runs
  BATCH_SIZE = 500

  WDL_VERSION_FOR_CARD_UPDATE = "1.2.4".freeze
  versions = WorkflowRun.where(workflow: WorkflowRun::WORKFLOW[:amr]).distinct.pluck(:wdl_version)

  def update_inputs_for_workflows(wdl_versions, inputs_hash, workflow_ids_failed_to_update)
    WorkflowRun
      .where(
        workflow: WorkflowRun::WORKFLOW[:amr],
        wdl_version: wdl_versions
      )
      .in_batches(of: BATCH_SIZE)
      .each_record do |workflow_run|
      workflow_run.add_inputs(inputs_hash)
    rescue StandardError
      workflow_ids_failed_to_update << workflow_run.id
      next
    end
  end

  # workflow runs at least 1.2.4 use CARD version 3.2.6 and wildcard version 4.0.0
  newer_workflow_versions = versions.compact.select do |num|
    Gem::Version.new(num) >= WDL_VERSION_FOR_CARD_UPDATE
  end

  inputs = {
    "card_version" => "3.2.6",
    "wildcard_version" => "4.0.0",
  }

  update_inputs_for_workflows(newer_workflow_versions, inputs, workflow_ids_failed_to_update)

  # workflow runs before 1.2.4 use CARD version 3.2.3 and wildcard version 3.1.0
  older_workflow_versions = versions.compact.select do |num|
    Gem::Version.new(num) < WDL_VERSION_FOR_CARD_UPDATE
  end

  inputs = {
    "card_version" => "3.2.3",
    "wildcard_version" => "3.1.0",
  }

  update_inputs_for_workflows(older_workflow_versions, inputs, workflow_ids_failed_to_update)

  puts("Failed to update #{workflow_ids_failed_to_update.length} workflow runs with ids #{workflow_ids_failed_to_update}")
end
