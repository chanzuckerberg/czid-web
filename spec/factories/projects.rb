FactoryBot.define do
  factory :project do
    transient do
      # The name of the host genome to create automatically for each sample
      host_genome_name { nil }
      # Array of samples entries to create.
      # The hash elements will be passed on to sample factory as keyword arguments.
      samples_data { [] }
    end

    sequence(:name) { |n| "Project #{n}" }
    sequence(:description) { |n| "Test project \##{n}" }
    public_access { 0 }

    trait :with_sample do
      after :create do |project, options|
        create(:sample, project: project, host_genome_name: options.host_genome_name)
      end
    end

    # guarantees that a samples is public by explicitly setting
    # project's `days_to_keep_sample_private` and sample's `created_at` explicitly
    trait :with_public_sample do
      days_to_keep_sample_private { 365.days.ago }
      after :create do |project, options|
        create(:sample, project: project, host_genome_name: options.host_genome_name, created_at: 366.days.ago)
      end
    end

    after :create do |project, options|
      options.samples_data.each do |sample_data|
        create(:sample, project: project, **sample_data)
      end
    end

    factory :public_project, parent: :project do
      public_access { 1 }
    end
  end
end
