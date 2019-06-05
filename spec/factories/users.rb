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
    sequence(:email, 'a') { |n| "user-#{n}@example.com" }
    sequence(:password, 'a') { |n| "user_#{n}_password" }
    sequence(:name, 'a') { |n| "User-#{n}" }
  end
end
