FactoryBot.define do
  factory :project do
    transient do
      # The name of the host genome to create automatically for each sample
      host_genome_name { nil }
      # Array of samples entries to create.
      # The hash elements will be passed on to sample factory as keyword arguments.
      samples_data { [] }
      # Number of metadata_field records to create
      metadata_fields_count { 2 }
    end

    sequence(:name) { |n| "Project #{n}" }
    sequence(:description) { |n| "Test project \##{n}" }
    public_access { 0 }

    metadata_fields do
      Array.new(metadata_fields_count) do
        association :metadata_field
      end
    end

    trait :with_sample do
      after :create do |project, options|
        create(:sample, project: project, host_genome_name: options.host_genome_name)
      end
    end

    # guarantees that a samples is public by explicitly setting
    # project's `days_to_keep_sample_private` and sample's `created_at` explicitly
    trait :with_public_sample do
      days_to_keep_sample_private { 365 }
      after :create do |project, options|
        create(:sample, project: project, host_genome_name: options.host_genome_name, created_at: 366.days.ago)
      end
    end

    after :create do |project, options|
      options.samples_data.each do |sample_data|
        number_of_pipeline_runs, number_of_cg_workflow_runs, number_of_amr_workflow_runs, workflow_runs_data = sample_data.values_at(:number_of_pipeline_runs, :number_of_cg_workflow_runs, :number_of_amr_workflow_runs, :workflow_runs_data)

        sample_data = sample_data.except(:number_of_pipeline_runs, :number_of_cg_workflow_runs, :number_of_amr_workflow_runs, :workflow_runs_data)
        s = create(:sample, project: project, **sample_data)

        if workflow_runs_data.present?
          workflow_runs_data.each do |workflow_run_data|
            create(:workflow_run, sample_id: s.id, **workflow_run_data)
          end
        end

        if number_of_pipeline_runs.present?
          number_of_pipeline_runs.times do
            create(:pipeline_run, sample_id: s.id)
          end
        end

        if number_of_cg_workflow_runs.present?
          number_of_cg_workflow_runs.times do
            create(:workflow_run, sample_id: s.id, workflow: WorkflowRun::WORKFLOW[:consensus_genome])
          end
        end

        if number_of_amr_workflow_runs.present?
          number_of_amr_workflow_runs.times do
            create(:workflow_run, sample_id: s.id, workflow: WorkflowRun::WORKFLOW[:amr])
          end
        end
      end
    end
  end

  factory :public_project, parent: :project do
    days_to_keep_sample_private { 365 }
    public_access { 1 }
  end
end
