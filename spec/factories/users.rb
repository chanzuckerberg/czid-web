FactoryBot.define do
  factory :admin, class: User do
    sequence(:email, 'a') { |n| "admin-#{n}@example.com" }
    name { "Admin User" }
    role { 1 }
  end

  factory :joe, class: User do
    email { "joe@example.com" }
    name { "Joe" }
  end

  factory :user do
    sequence(:email, 'a') { |n| "user-#{n}@example.com" }
    sequence(:name, 'a') { |n| "User-#{n}" }
  end
end
