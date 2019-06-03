FactoryBot.define do
  factory :project do
    transient do
      host_genome_name { nil }
      samples_data { [] }
    end

    sequence(:name) { |n| "Project #{n}" }
    public_access { 0 }


    trait :with_samples do
      after :create do |project, options|
        create(:sample, project: project, host_genome_name: options.host_genome_name)
      end
    end

    trait :with_public_samples do
      after :create do |project, options|
        create(:sample, :older_than_1year, project: project, host_genome_name: options.host_genome_name)
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
