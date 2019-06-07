FactoryBot.define do
  factory :admin, class: User do
    email { "admin@example.com" }
    password { "admin_password" }
    name { "Admin User" }
    role { 1 }
  end

  factory :joe, class: User do
    email { "joe@example.com" }
    password { "joe_password" }
    name { "Joe" }
  end

  factory :user do
    transient do
      # Array of strings to enable feature flags.
      allowed_features { [] }
    end

    sequence(:email, 'a') { |n| "user-#{n}@example.com" }
    sequence(:password, 'a') { |n| "user_#{n}_password" }
    sequence(:name, 'a') { |n| "User-#{n}" }

    after :create do |user, options|
      options.allowed_features.each do |allowed_feature|
        user.add_allowed_feature allowed_feature
        user.save!
      end
    end
  end
end
